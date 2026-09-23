from typing import Optional, List
import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import joinedload

from app.modules.contributions.models import Contribution
from app.modules.contributions.schemas import ContributionCreate
from app.modules.members.models import Member
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.cache import cache_service


class ContributionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_contributions(
        self,
        skip: int = 0,
        limit: int = 50,
        member_id: Optional[uuid.UUID] = None,
        fund_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None
    ) -> tuple[List[Contribution], int]:
        query = select(Contribution).options(
            joinedload(Contribution.member),
            joinedload(Contribution.fund)
        )
        count_query = select(func.count(Contribution.id))

        if member_id:
            query = query.where(Contribution.member_id == member_id)
            count_query = count_query.where(Contribution.member_id == member_id)

        if fund_id:
            query = query.where(Contribution.fund_id == fund_id)
            count_query = count_query.where(Contribution.fund_id == fund_id)

        if search:
            filt = or_(
                Contribution.receipt_number.ilike(f"%{search}%"),
                Contribution.payment_reference.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(Contribution.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, c_in: ContributionCreate, created_by: Optional[str] = None) -> Contribution:
        if c_in.amount <= 0:
            raise BadRequestException("Contribution amount must be greater than zero.")

        # Check member
        res_m = await self.db.execute(select(Member).where(Member.id == c_in.member_id))
        member = res_m.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", c_in.member_id)

        # Check fund
        res_f = await self.db.execute(select(Fund).where(Fund.id == c_in.fund_id))
        fund = res_f.scalar_one_or_none()
        if not fund or not fund.is_active:
            raise NotFoundException("Active Fund", c_in.fund_id)

        receipt_num = f"CON-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"

        # 1. Update fund balance
        fund.current_balance = float(fund.current_balance) + float(c_in.amount)

        # 2. Record contribution
        contrib = Contribution(
            receipt_number=receipt_num,
            member_id=member.id,
            fund_id=fund.id,
            amount=c_in.amount,
            contribution_type=c_in.contribution_type,
            payment_method=c_in.payment_method,
            payment_reference=c_in.payment_reference,
            status="completed",
            contribution_date=c_in.contribution_date
        )
        self.db.add(contrib)

        # 3. Financial Transaction audit trail
        tx = FinancialTransaction(
            transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            fund_id=fund.id,
            transaction_type="credit",
            category="contribution",
            amount=c_in.amount,
            balance_after=fund.current_balance,
            source_module="contributions",
            source_reference=receipt_num,
            description=f"Member {member.member_number} ({member.full_name}) {c_in.contribution_type.replace('_', ' ').title()}",
            created_by=created_by,
            transaction_date=c_in.contribution_date
        )
        self.db.add(tx)

        # 4. Double-entry ledger
        entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
        # Debit Cash/Bank Asset
        debit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1010",
            account_name="Cash & Bank Assets",
            account_type="asset",
            debit=c_in.amount,
            credit=0.0,
            description=f"Contribution received {receipt_num}",
            reference=receipt_num,
            entry_date=c_in.contribution_date
        )
        # Credit Member Savings Liability
        credit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="2010",
            account_name="Member Savings Liability",
            account_type="liability",
            debit=0.0,
            credit=c_in.amount,
            description=f"Member savings liability credited {receipt_num}",
            reference=receipt_num,
            entry_date=c_in.contribution_date
        )
        self.db.add(debit_entry)
        self.db.add(credit_entry)

        await self.db.commit()
        await self.db.refresh(contrib)
        await cache_service.delete("dashboard:overview")
        return contrib
