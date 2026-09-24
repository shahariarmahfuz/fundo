import uuid
from datetime import date, datetime
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import joinedload

from app.modules.sadaqa.models import SadaqaDonation
from app.modules.sadaqa.schemas import (
    SadaqaCreate,
    SadaqaUpdate,
    SadaqaReportResponse,
    FundBreakdown,
    MonthlyBreakdown,
    DonorTypeBreakdown,
    TopDonorItem
)
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.modules.members.models import Member
from app.modules.beneficiaries.models import Beneficiary
from app.core.exceptions import BadRequestException, NotFoundException


class SadaqaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_sadaqa(
        self,
        skip: int = 0,
        limit: int = 20,
        fund_id: Optional[uuid.UUID] = None,
        donor_type: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[str] = None
    ) -> Tuple[List[SadaqaDonation], int]:
        query = select(SadaqaDonation).options(
            joinedload(SadaqaDonation.fund),
            joinedload(SadaqaDonation.member),
            joinedload(SadaqaDonation.beneficiary)
        )
        count_query = select(func.count(SadaqaDonation.id))

        filters = []
        if fund_id:
            filters.append(SadaqaDonation.fund_id == fund_id)
        if donor_type and donor_type != "all":
            filters.append(SadaqaDonation.donor_type == donor_type)
        if status and status != "all":
            filters.append(SadaqaDonation.status == status)
        if start_date:
            filters.append(SadaqaDonation.donation_date >= start_date)
        if end_date:
            filters.append(SadaqaDonation.donation_date <= end_date)
        if search and search.strip():
            s = f"%{search.strip()}%"
            filters.append(
                or_(
                    SadaqaDonation.receipt_number.ilike(s),
                    SadaqaDonation.donor_name.ilike(s),
                    SadaqaDonation.reference.ilike(s),
                    SadaqaDonation.purpose.ilike(s)
                )
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar() or 0

        query = query.order_by(
            SadaqaDonation.donation_date.desc(),
            SadaqaDonation.created_at.desc()
        ).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_id(self, donation_id: uuid.UUID) -> Optional[SadaqaDonation]:
        query = (
            select(SadaqaDonation)
            .options(
                joinedload(SadaqaDonation.fund),
                joinedload(SadaqaDonation.member),
                joinedload(SadaqaDonation.beneficiary)
            )
            .where(SadaqaDonation.id == donation_id)
        )
        res = await self.db.execute(query)
        return res.scalar_one_or_none()

    async def create_sadaqa(
        self,
        sadaqa_in: SadaqaCreate,
        created_by: Optional[str] = None
    ) -> SadaqaDonation:
        if sadaqa_in.amount <= 0:
            raise BadRequestException("Sadaqa donation amount must be greater than zero.")

        # 1. Validate Fund
        fund_res = await self.db.execute(select(Fund).where(Fund.id == sadaqa_in.fund_id))
        fund = fund_res.scalar_one_or_none()
        if not fund or not fund.is_active:
            raise NotFoundException("Active destination Fund", sadaqa_in.fund_id)

        # 2. Resolve Donor information
        donor_name = "Anonymous Donor" if sadaqa_in.is_anonymous else (sadaqa_in.donor_name or "").strip()
        donor_email = sadaqa_in.donor_email
        donor_phone = sadaqa_in.donor_phone

        if sadaqa_in.donor_type == "member" and sadaqa_in.member_id:
            m_res = await self.db.execute(select(Member).where(Member.id == sadaqa_in.member_id))
            member = m_res.scalar_one_or_none()
            if member:
                if not sadaqa_in.is_anonymous:
                    donor_name = member.full_name
                    donor_email = donor_email or member.email
                    donor_phone = donor_phone or member.phone
        elif sadaqa_in.donor_type == "beneficiary" and sadaqa_in.beneficiary_id:
            b_res = await self.db.execute(select(Beneficiary).where(Beneficiary.id == sadaqa_in.beneficiary_id))
            beneficiary = b_res.scalar_one_or_none()
            if beneficiary:
                if not sadaqa_in.is_anonymous:
                    donor_name = beneficiary.full_name
                    donor_phone = donor_phone or beneficiary.phone

        if not donor_name:
            donor_name = "Anonymous Donor" if sadaqa_in.is_anonymous else "Kind Donor"

        donation_dt = sadaqa_in.donation_date or date.today()
        receipt_num = f"SAD-{donation_dt.strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"

        try:
            # Atomic financial transaction:
            # 1. Update fund balance
            fund.current_balance = float(fund.current_balance) + float(sadaqa_in.amount)

            # 2. Create Sadaqa donation record
            donation = SadaqaDonation(
                receipt_number=receipt_num,
                donor_type=sadaqa_in.donor_type,
                member_id=sadaqa_in.member_id,
                beneficiary_id=sadaqa_in.beneficiary_id,
                donor_name=donor_name,
                donor_email=donor_email,
                donor_phone=donor_phone,
                is_anonymous=sadaqa_in.is_anonymous,
                amount=float(sadaqa_in.amount),
                fund_id=fund.id,
                donation_date=donation_dt,
                payment_method=sadaqa_in.payment_method,
                reference=sadaqa_in.reference,
                purpose=sadaqa_in.purpose or "General Sadaqa",
                notes=sadaqa_in.notes,
                status="completed",
                created_by=created_by
            )
            self.db.add(donation)

            # 3. Create immutable Financial Transaction audit record
            txn = FinancialTransaction(
                transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                fund_id=fund.id,
                transaction_type="credit",
                category="sadaqa",
                amount=float(sadaqa_in.amount),
                balance_after=float(fund.current_balance),
                source_module="sadaqa",
                source_reference=receipt_num,
                description=f"Sadaqa donation received from {donor_name}",
                created_by=created_by,
                transaction_date=donation_dt
            )
            self.db.add(txn)

            # 4. Create double-entry bookkeeping ledger entries
            jrn_num = f"JRN-SAD-{uuid.uuid4().hex[:8].upper()}"
            # Debit: Cash & Bank Assets (Asset increases)
            debit_entry = LedgerEntry(
                entry_number=jrn_num,
                account_code="1010",
                account_name="Cash & Bank Assets",
                account_type="asset",
                debit=float(sadaqa_in.amount),
                credit=0.0,
                description=f"Sadaqa donation received - {receipt_num}",
                reference=receipt_num,
                entry_date=donation_dt
            )
            # Credit: Donation & Sadaqa Revenue (Revenue increases)
            credit_entry = LedgerEntry(
                entry_number=jrn_num,
                account_code="4010",
                account_name="Donation & Sadaqa Revenue",
                account_type="revenue",
                debit=0.0,
                credit=float(sadaqa_in.amount),
                description=f"Recognized Sadaqa revenue - {receipt_num}",
                reference=receipt_num,
                entry_date=donation_dt
            )
            self.db.add_all([debit_entry, credit_entry])

            await self.db.commit()
            await self.db.refresh(donation)
            return await self.get_by_id(donation.id)
        except Exception as e:
            await self.db.rollback()
            raise e

    async def update_sadaqa(
        self,
        donation_id: uuid.UUID,
        update_in: SadaqaUpdate
    ) -> SadaqaDonation:
        donation = await self.get_by_id(donation_id)
        if not donation:
            raise NotFoundException("Sadaqa donation", donation_id)

        if update_in.donor_name is not None:
            donation.donor_name = update_in.donor_name
        if update_in.donor_email is not None:
            donation.donor_email = update_in.donor_email
        if update_in.donor_phone is not None:
            donation.donor_phone = update_in.donor_phone
        if update_in.purpose is not None:
            donation.purpose = update_in.purpose
        if update_in.reference is not None:
            donation.reference = update_in.reference
        if update_in.notes is not None:
            donation.notes = update_in.notes
        if update_in.status is not None:
            donation.status = update_in.status

        await self.db.commit()
        await self.db.refresh(donation)
        return donation

    async def delete_sadaqa(self, donation_id: uuid.UUID, cancelled_by: Optional[str] = None):
        donation = await self.get_by_id(donation_id)
        if not donation:
            raise NotFoundException("Sadaqa donation", donation_id)

        try:
            # If completed, reverse fund balance atomically
            if donation.status == "completed":
                fund_res = await self.db.execute(select(Fund).where(Fund.id == donation.fund_id))
                fund = fund_res.scalar_one_or_none()
                if fund:
                    fund.current_balance = max(0.0, float(fund.current_balance) - float(donation.amount))

                    # Reversal financial transaction
                    txn = FinancialTransaction(
                        transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                        fund_id=fund.id,
                        transaction_type="debit",
                        category="sadaqa_void",
                        amount=float(donation.amount),
                        balance_after=float(fund.current_balance),
                        source_module="sadaqa",
                        source_reference=donation.receipt_number,
                        description=f"Voided Sadaqa donation {donation.receipt_number}",
                        created_by=cancelled_by,
                        transaction_date=date.today()
                    )
                    self.db.add(txn)

                    # Reversal ledger entry
                    jrn_rev = f"JRN-VOID-{uuid.uuid4().hex[:8].upper()}"
                    debit_rev = LedgerEntry(
                        entry_number=jrn_rev,
                        account_code="4010",
                        account_name="Donation & Sadaqa Revenue",
                        account_type="revenue",
                        debit=float(donation.amount),
                        credit=0.0,
                        description=f"Void revenue for cancelled Sadaqa {donation.receipt_number}",
                        reference=donation.receipt_number,
                        entry_date=date.today()
                    )
                    credit_rev = LedgerEntry(
                        entry_number=jrn_rev,
                        account_code="1010",
                        account_name="Cash & Bank Assets",
                        account_type="asset",
                        debit=0.0,
                        credit=float(donation.amount),
                        description=f"Void cash entry for cancelled Sadaqa {donation.receipt_number}",
                        reference=donation.receipt_number,
                        entry_date=date.today()
                    )
                    self.db.add_all([debit_rev, credit_rev])

            donation.status = "cancelled"
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            raise e

    async def get_reports(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        fund_id: Optional[uuid.UUID] = None
    ) -> SadaqaReportResponse:
        base_filters = [SadaqaDonation.status == "completed"]
        if start_date:
            base_filters.append(SadaqaDonation.donation_date >= start_date)
        if end_date:
            base_filters.append(SadaqaDonation.donation_date <= end_date)
        if fund_id:
            base_filters.append(SadaqaDonation.fund_id == fund_id)

        # 1. Total received & count
        totals_query = select(
            func.coalesce(func.sum(SadaqaDonation.amount), 0.0),
            func.count(SadaqaDonation.id)
        ).where(and_(*base_filters))
        totals_res = await self.db.execute(totals_query)
        total_amount, total_count = totals_res.one()
        total_amount = float(total_amount)
        total_count = int(total_count)
        avg_donation = round(total_amount / total_count, 2) if total_count > 0 else 0.0

        # 2. This month & This year totals
        today = date.today()
        first_of_month = date(today.year, today.month, 1)
        first_of_year = date(today.year, 1, 1)

        m_res = await self.db.execute(
            select(func.coalesce(func.sum(SadaqaDonation.amount), 0.0)).where(
                and_(SadaqaDonation.status == "completed", SadaqaDonation.donation_date >= first_of_month)
            )
        )
        this_month_amount = float(m_res.scalar() or 0.0)

        y_res = await self.db.execute(
            select(func.coalesce(func.sum(SadaqaDonation.amount), 0.0)).where(
                and_(SadaqaDonation.status == "completed", SadaqaDonation.donation_date >= first_of_year)
            )
        )
        this_year_amount = float(y_res.scalar() or 0.0)

        # 3. Fund breakdown
        fund_query = (
            select(
                Fund.id,
                Fund.name,
                Fund.code,
                func.count(SadaqaDonation.id),
                func.coalesce(func.sum(SadaqaDonation.amount), 0.0)
            )
            .join(Fund, SadaqaDonation.fund_id == Fund.id)
            .where(and_(*base_filters))
            .group_by(Fund.id, Fund.name, Fund.code)
            .order_by(desc(func.sum(SadaqaDonation.amount)))
        )
        fund_res = await self.db.execute(fund_query)
        fund_breakdown = []
        for fid, fname, fcode, fcnt, famt in fund_res.all():
            famt = float(famt)
            pct = round((famt / total_amount * 100), 1) if total_amount > 0 else 0.0
            fund_breakdown.append(
                FundBreakdown(
                    fund_id=fid,
                    fund_name=fname,
                    fund_code=fcode,
                    count=int(fcnt),
                    total_amount=famt,
                    percentage=pct
                )
            )

        # 4. Donor type breakdown
        donor_query = (
            select(
                SadaqaDonation.donor_type,
                func.count(SadaqaDonation.id),
                func.coalesce(func.sum(SadaqaDonation.amount), 0.0)
            )
            .where(and_(*base_filters))
            .group_by(SadaqaDonation.donor_type)
        )
        donor_res = await self.db.execute(donor_query)
        donor_type_breakdown = [
            DonorTypeBreakdown(donor_type=dtype, count=int(dcnt), total_amount=float(damt))
            for dtype, dcnt, damt in donor_res.all()
        ]

        # 5. Monthly breakdown (last 12 months)
        # Using cast to string format YYYY-MM
        month_expr = func.to_char(SadaqaDonation.donation_date, "YYYY-MM")
        month_query = (
            select(
                month_expr.label("month"),
                func.count(SadaqaDonation.id),
                func.coalesce(func.sum(SadaqaDonation.amount), 0.0)
            )
            .where(and_(*base_filters))
            .group_by("month")
            .order_by(desc("month"))
            .limit(12)
        )
        month_res = await self.db.execute(month_query)
        monthly_breakdown = [
            MonthlyBreakdown(month=m, count=int(mcnt), total_amount=float(mamt))
            for m, mcnt, mamt in month_res.all()
        ]

        # 6. Top Donors (Up to 10)
        top_query = (
            select(
                SadaqaDonation.donor_name,
                SadaqaDonation.donor_type,
                func.count(SadaqaDonation.id),
                func.coalesce(func.sum(SadaqaDonation.amount), 0.0)
            )
            .where(and_(*base_filters, SadaqaDonation.donor_name != "Anonymous Donor"))
            .group_by(SadaqaDonation.donor_name, SadaqaDonation.donor_type)
            .order_by(desc(func.sum(SadaqaDonation.amount)))
            .limit(10)
        )
        top_res = await self.db.execute(top_query)
        top_donors = [
            TopDonorItem(
                donor_name=dname,
                donor_type=dtype,
                count=int(cnt),
                total_amount=float(amt)
            )
            for dname, dtype, cnt, amt in top_res.all()
        ]

        return SadaqaReportResponse(
            total_amount_received=total_amount,
            total_donations_count=total_count,
            average_donation_amount=avg_donation,
            this_month_amount=this_month_amount,
            this_year_amount=this_year_amount,
            fund_breakdown=fund_breakdown,
            monthly_breakdown=monthly_breakdown,
            donor_type_breakdown=donor_type_breakdown,
            top_donors=top_donors
        )
