from typing import Optional, List, Tuple
import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import joinedload, selectinload

from app.modules.contributions.models import Contribution
from app.modules.contributions.schemas import (
    ContributionCreate,
    ContributionResponse,
    MemberDuePreviewResponse,
    MemberMonthlyLedgerItem,
    MemberContributionLedgerResponse,
    GroupFundResponse,
    GroupMemberFundStatus,
    BaseContributionRateResponse,
    BaseContributionRateUpdate
)
from app.modules.members.models import Member
from app.modules.groups.models import Group
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.modules.settings.models import SystemSetting, BaseContributionRate
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.cache import cache_service


class ContributionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_base_rate_for_month(self, month_str: str) -> float:
        """
        Determines the applicable expected base monthly contribution for a specific accounting month (YYYY-MM).
        Checks BaseContributionRate history table first; if none match, falls back to SystemSetting.
        """
        try:
            year_str, m_str = month_str.split("-")
            month_date = date(int(year_str), int(m_str), 1)
        except Exception:
            month_date = date.today().replace(day=1)

        # Query effective rate for month_date
        query = select(BaseContributionRate).where(
            BaseContributionRate.effective_from <= month_date,
            or_(
                BaseContributionRate.effective_to.is_(None),
                BaseContributionRate.effective_to >= month_date
            )
        ).order_by(desc(BaseContributionRate.effective_from)).limit(1)

        res = await self.db.execute(query)
        rate = res.scalar_one_or_none()
        if rate:
            return float(rate.amount)

        # Fallback to system_settings
        setting_res = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "base_monthly_contribution")
        )
        setting = setting_res.scalar_one_or_none()
        if setting:
            try:
                return float(setting.value)
            except ValueError:
                pass

        return 100.0  # Default ৳100

    async def get_member_due_preview(
        self,
        member_id: uuid.UUID,
        month: Optional[str] = None
    ) -> MemberDuePreviewResponse:
        """
        Calculates expected base contribution, already paid, and outstanding due for a member in a specific month.
        """
        target_month = month or date.today().strftime("%Y-%m")

        member_res = await self.db.execute(
            select(Member).options(joinedload(Member.group)).where(Member.id == member_id)
        )
        member = member_res.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", member_id)

        base_amount = await self.get_base_rate_for_month(target_month)

        paid_res = await self.db.scalar(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                Contribution.member_id == member_id,
                Contribution.contribution_month == target_month,
                Contribution.status == "completed"
            )
        )
        already_paid = float(paid_res or 0.0)
        outstanding_due = max(base_amount - already_paid, 0.0)

        return MemberDuePreviewResponse(
            member_id=member.id,
            member_name=member.full_name,
            member_number=member.member_number,
            group_id=member.group_id,
            group_name=member.group.name if member.group else None,
            contribution_month=target_month,
            base_contribution=base_amount,
            already_paid=already_paid,
            outstanding_due=outstanding_due
        )

    async def list_contributions(
        self,
        skip: int = 0,
        limit: int = 50,
        member_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        fund_id: Optional[uuid.UUID] = None,
        contribution_month: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Contribution], int]:
        query = select(Contribution).options(
            joinedload(Contribution.member),
            joinedload(Contribution.group),
            joinedload(Contribution.fund)
        )
        count_query = select(func.count(Contribution.id))

        if member_id:
            query = query.where(Contribution.member_id == member_id)
            count_query = count_query.where(Contribution.member_id == member_id)

        if group_id:
            query = query.where(Contribution.group_id == group_id)
            count_query = count_query.where(Contribution.group_id == group_id)

        if fund_id:
            query = query.where(Contribution.fund_id == fund_id)
            count_query = count_query.where(Contribution.fund_id == fund_id)

        if contribution_month:
            query = query.where(Contribution.contribution_month == contribution_month)
            count_query = count_query.where(Contribution.contribution_month == contribution_month)

        if search:
            filt = or_(
                Contribution.receipt_number.ilike(f"%{search}%"),
                Contribution.payment_reference.ilike(f"%{search}%"),
                Contribution.notes.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(Contribution.contribution_date), desc(Contribution.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, c_in: ContributionCreate, recorded_by: Optional[str] = None) -> Contribution:
        """
        Records a member contribution and settles it in double-entry accounting.
        - Accepts any valid positive amount (less than, equal to, or greater than base).
        - Automatically resolves and binds the member's current Group.
        - Updates target Fund balance.
        - Emits an append-only FinancialTransaction and balanced LedgerEntry pair.
        """
        if c_in.amount <= 0:
            raise BadRequestException("Contribution amount must be greater than zero.")

        # 1. Verify Member & Group
        res_m = await self.db.execute(
            select(Member).options(joinedload(Member.group)).where(Member.id == c_in.member_id)
        )
        member = res_m.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", c_in.member_id)

        if not member.group_id:
            raise BadRequestException("Member must be assigned to an active Group before recording contributions.")

        group_id = member.group_id
        group_name = member.group.name if member.group else "Assigned Group"

        # 2. Determine target fund
        if c_in.fund_id:
            res_f = await self.db.execute(select(Fund).where(Fund.id == c_in.fund_id))
            fund = res_f.scalar_one_or_none()
            if not fund or not fund.is_active:
                raise NotFoundException("Active Fund", c_in.fund_id)
        else:
            # Fallback to default active savings or general fund
            res_f = await self.db.execute(
                select(Fund).where(Fund.is_active == True).order_by(asc(Fund.created_at)).limit(1)
            )
            fund = res_f.scalar_one_or_none()
            if not fund:
                raise BadRequestException("No active fund account available to receive contributions.")

        # 3. Resolve dates
        target_date = c_in.contribution_date or date.today()
        target_month = c_in.contribution_month or target_date.strftime("%Y-%m")
        receipt_num = f"CON-{target_month.replace('-', '')}-{uuid.uuid4().hex[:8].upper()}"

        # 4. Update Fund balance
        fund.current_balance = float(fund.current_balance) + float(c_in.amount)

        # 5. Create Contribution record
        contrib = Contribution(
            receipt_number=receipt_num,
            member_id=member.id,
            group_id=group_id,
            fund_id=fund.id,
            amount=c_in.amount,
            contribution_month=target_month,
            contribution_type=c_in.contribution_type,
            payment_method=c_in.payment_method,
            payment_reference=c_in.payment_reference,
            notes=c_in.notes,
            status="completed",
            contribution_date=target_date,
            recorded_by=recorded_by
        )
        self.db.add(contrib)

        # 6. Immutable Financial Transaction
        tx = FinancialTransaction(
            transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            fund_id=fund.id,
            transaction_type="credit",
            category="contribution",
            amount=c_in.amount,
            balance_after=fund.current_balance,
            source_module="contributions",
            source_reference=receipt_num,
            description=f"Member {member.member_number} ({member.full_name}) - Group {group_name} - Month {target_month} Contribution",
            created_by=recorded_by,
            transaction_date=target_date
        )
        self.db.add(tx)

        # 7. Double-entry ledger
        entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
        # Debit Cash/Bank Asset
        debit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1010",
            account_name="Cash & Bank Assets",
            account_type="asset",
            debit=c_in.amount,
            credit=0.0,
            description=f"Contribution received {receipt_num} (Group: {group_name})",
            reference=receipt_num,
            entry_date=target_date
        )
        # Credit Member Savings / Group Fund Liability
        credit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="2010",
            account_name="Member Savings Liability",
            account_type="liability",
            debit=0.0,
            credit=c_in.amount,
            description=f"Member savings credited {receipt_num} - {member.full_name}",
            reference=receipt_num,
            entry_date=target_date
        )
        self.db.add(debit_entry)
        self.db.add(credit_entry)

        await self.db.commit()
        await self.db.refresh(contrib)
        await cache_service.delete("dashboard:overview")
        return contrib

    async def get_member_ledger(self, member_id: uuid.UUID) -> MemberContributionLedgerResponse:
        """
        Builds the complete monthly contribution passbook / ledger for an individual member.
        Compares expected base contribution vs actual contributions for each active month.
        """
        member_res = await self.db.execute(
            select(Member).options(joinedload(Member.group)).where(Member.id == member_id)
        )
        member = member_res.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", member_id)

        # Fetch all contributions for this member
        contribs_res = await self.db.execute(
            select(Contribution).options(
                joinedload(Contribution.group),
                joinedload(Contribution.fund)
            ).where(
                Contribution.member_id == member_id,
                Contribution.status == "completed"
            ).order_by(asc(Contribution.contribution_date), asc(Contribution.created_at))
        )
        all_contribs = list(contribs_res.scalars().all())

        # Determine range of months: from join_date or first contribution date to current month
        today = date.today()
        start_date = member.join_date or (all_contribs[0].contribution_date if all_contribs else today)
        if start_date > today:
            start_date = today

        # Generate list of YYYY-MM strings
        curr_y, curr_m = start_date.year, start_date.month
        end_y, end_m = today.year, today.month

        months_list: List[str] = []
        while (curr_y < end_y) or (curr_y == end_y and curr_m <= end_m):
            months_list.append(f"{curr_y:04d}-{curr_m:02d}")
            curr_m += 1
            if curr_m > 12:
                curr_m = 1
                curr_y += 1

        # Also add any month where a contribution was recorded even if prior to join_date
        for c in all_contribs:
            if c.contribution_month and c.contribution_month not in months_list:
                months_list.append(c.contribution_month)
        months_list.sort(reverse=True)

        monthly_records: List[MemberMonthlyLedgerItem] = []
        total_expected = 0.0
        total_paid = 0.0
        total_due = 0.0

        # Group contributions by month
        contribs_by_month: dict[str, List[Contribution]] = {}
        for c in all_contribs:
            contribs_by_month.setdefault(c.contribution_month, []).append(c)

        for m_str in months_list:
            expected = await self.get_base_rate_for_month(m_str)
            m_contribs = contribs_by_month.get(m_str, [])
            paid = sum(float(c.amount) for c in m_contribs)
            due = max(expected - paid, 0.0)

            total_expected += expected
            total_paid += paid
            total_due += due

            if paid == 0.0:
                status = "unpaid"
            elif paid < expected:
                status = "partial"
            elif paid == expected:
                status = "paid"
            else:
                status = "surplus"

            payments_resp = [
                ContributionResponse(
                    id=c.id,
                    receipt_number=c.receipt_number,
                    member_id=c.member_id,
                    member_name=member.full_name,
                    member_number=member.member_number,
                    group_id=c.group_id,
                    group_name=c.group.name if c.group else None,
                    group_code=c.group.code if c.group else None,
                    fund_id=c.fund_id,
                    fund_name=c.fund.name if c.fund else None,
                    amount=float(c.amount),
                    contribution_month=c.contribution_month,
                    contribution_type=c.contribution_type,
                    payment_method=c.payment_method,
                    payment_reference=c.payment_reference,
                    notes=c.notes,
                    status=c.status,
                    contribution_date=c.contribution_date,
                    recorded_by=c.recorded_by,
                    created_at=c.created_at,
                    updated_at=c.updated_at
                )
                for c in m_contribs
            ]

            monthly_records.append(
                MemberMonthlyLedgerItem(
                    month=m_str,
                    expected_amount=expected,
                    paid_amount=paid,
                    due_amount=due,
                    status=status,
                    payments=payments_resp
                )
            )

        transactions_resp = [
            ContributionResponse(
                id=c.id,
                receipt_number=c.receipt_number,
                member_id=c.member_id,
                member_name=member.full_name,
                member_number=member.member_number,
                group_id=c.group_id,
                group_name=c.group.name if c.group else None,
                group_code=c.group.code if c.group else None,
                fund_id=c.fund_id,
                fund_name=c.fund.name if c.fund else None,
                amount=float(c.amount),
                contribution_month=c.contribution_month,
                contribution_type=c.contribution_type,
                payment_method=c.payment_method,
                payment_reference=c.payment_reference,
                notes=c.notes,
                status=c.status,
                contribution_date=c.contribution_date,
                recorded_by=c.recorded_by,
                created_at=c.created_at,
                updated_at=c.updated_at
            )
            for c in reversed(all_contribs)
        ]

        return MemberContributionLedgerResponse(
            member_id=member.id,
            member_name=member.full_name,
            member_number=member.member_number,
            group_id=member.group_id,
            group_name=member.group.name if member.group else None,
            join_date=member.join_date,
            total_expected=total_expected,
            total_paid=total_paid,
            total_due=total_due,
            monthly_records=monthly_records,
            transactions=transactions_resp
        )

    async def get_group_fund(self, group_id: uuid.UUID, target_month: Optional[str] = None) -> GroupFundResponse:
        """
        Calculates Group Fund balances and per-member contribution performance.
        - Preserves historical group allocation (contributions originally recorded for this group stay with it).
        - Computes current month collections, lifetime balance, and outstanding due across active members.
        """
        curr_month = target_month or date.today().strftime("%Y-%m")

        group_res = await self.db.execute(
            select(Group).options(selectinload(Group.members)).where(Group.id == group_id)
        )
        group = group_res.scalar_one_or_none()
        if not group:
            raise NotFoundException("Group", group_id)

        # Lifetime group contributions sum
        total_group_res = await self.db.scalar(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                Contribution.group_id == group_id,
                Contribution.status == "completed"
            )
        )
        total_group_contributions = float(total_group_res or 0.0)

        # Current month group contributions sum
        curr_month_res = await self.db.scalar(
            select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                Contribution.group_id == group_id,
                Contribution.contribution_month == curr_month,
                Contribution.status == "completed"
            )
        )
        current_month_contributions = float(curr_month_res or 0.0)

        # Monthly expected rate for current month
        base_rate = await self.get_base_rate_for_month(curr_month)

        # Member by member summary
        members_res = await self.db.execute(
            select(Member).where(Member.group_id == group_id).order_by(Member.member_number.asc())
        )
        group_members = list(members_res.scalars().all())

        members_summary: List[GroupMemberFundStatus] = []
        total_outstanding_due = 0.0

        for m in group_members:
            # Current month paid
            m_month_paid_res = await self.db.scalar(
                select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                    Contribution.member_id == m.id,
                    Contribution.contribution_month == curr_month,
                    Contribution.status == "completed"
                )
            )
            m_month_paid = float(m_month_paid_res or 0.0)
            m_month_due = max(base_rate - m_month_paid, 0.0)
            total_outstanding_due += m_month_due

            # Lifetime paid by member
            m_lifetime_paid_res = await self.db.scalar(
                select(func.coalesce(func.sum(Contribution.amount), 0)).where(
                    Contribution.member_id == m.id,
                    Contribution.status == "completed"
                )
            )
            m_lifetime_paid = float(m_lifetime_paid_res or 0.0)

            members_summary.append(
                GroupMemberFundStatus(
                    member_id=m.id,
                    member_name=m.full_name,
                    member_number=m.member_number,
                    membership_status=m.membership_status,
                    current_month_expected=base_rate,
                    current_month_paid=m_month_paid,
                    current_month_due=m_month_due,
                    lifetime_contributed=m_lifetime_paid
                )
            )

        return GroupFundResponse(
            group_id=group.id,
            group_name=group.name,
            group_code=group.code,
            region=group.region,
            meeting_frequency=group.meeting_frequency,
            status=group.status,
            total_members=len(group_members),
            current_month=curr_month,
            current_month_contributions=current_month_contributions,
            total_contributions=total_group_contributions,
            outstanding_member_due=total_outstanding_due,
            members=members_summary
        )

    # Base Contribution Rates Management
    async def list_rates(self) -> List[BaseContributionRate]:
        res = await self.db.execute(
            select(BaseContributionRate).order_by(desc(BaseContributionRate.effective_from))
        )
        return list(res.scalars().all())

    async def update_base_rate(
        self,
        new_rate: BaseContributionRateUpdate,
        created_by: Optional[str] = None
    ) -> BaseContributionRate:
        """
        Updates the Foundation Base Monthly Contribution.
        - Preserves historical records: updates the effective_to date of currently active rate.
        - Creates a new rate with effective_from.
        - Updates the SystemSetting 'base_monthly_contribution'.
        """
        eff_from = new_rate.effective_from or date.today().replace(day=1)

        # Close out previous active rates that overlap
        prev_rates_res = await self.db.execute(
            select(BaseContributionRate).where(
                or_(
                    BaseContributionRate.effective_to.is_(None),
                    BaseContributionRate.effective_to >= eff_from
                )
            )
        )
        prev_rates = prev_rates_res.scalars().all()
        for r in prev_rates:
            if r.effective_from < eff_from:
                r.effective_to = eff_from - timedelta(days=1)
            elif r.effective_from == eff_from:
                r.effective_to = eff_from

        new_entry = BaseContributionRate(
            amount=new_rate.amount,
            effective_from=eff_from,
            effective_to=None,
            description=new_rate.description or f"Updated standard base contribution to {new_rate.amount}",
            created_by=created_by
        )
        self.db.add(new_entry)

        # Update SystemSetting key
        setting_res = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "base_monthly_contribution")
        )
        setting = setting_res.scalar_one_or_none()
        if setting:
            setting.value = str(new_rate.amount)
        else:
            self.db.add(
                SystemSetting(
                    key="base_monthly_contribution",
                    value=str(new_rate.amount),
                    category="financial",
                    description="Foundation standard base monthly contribution expected from each member (e.g. ৳100)",
                    is_public=True
                )
            )

        await self.db.commit()
        await self.db.refresh(new_entry)
        await cache_service.delete("settings:public")
        return new_entry
