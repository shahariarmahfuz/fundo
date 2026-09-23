import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import joinedload

from app.modules.finance.models import Fund, Donation, FinancialTransaction, LedgerEntry
from app.modules.finance.schemas import FundCreate, FundUpdate, DonationCreate, LedgerEntryCreate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.cache import cache_service


class FinanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Fund Operations
    async def get_fund_by_id(self, fund_id: uuid.UUID) -> Optional[Fund]:
        result = await self.db.execute(select(Fund).where(Fund.id == fund_id))
        return result.scalar_one_or_none()

    async def get_fund_by_code(self, code: str) -> Optional[Fund]:
        result = await self.db.execute(select(Fund).where(Fund.code == code.upper().strip()))
        return result.scalar_one_or_none()

    async def list_funds(self, active_only: bool = False) -> List[Fund]:
        query = select(Fund)
        if active_only:
            query = query.where(Fund.is_active == True)
        result = await self.db.execute(query.order_by(Fund.name.asc()))
        return list(result.scalars().all())

    async def create_fund(self, fund_in: FundCreate) -> Fund:
        existing = await self.get_fund_by_code(fund_in.code)
        if existing:
            raise ConflictException(f"Fund with code '{fund_in.code}' already exists.")

        fund = Fund(
            code=fund_in.code.upper().strip(),
            name=fund_in.name.strip(),
            fund_type=fund_in.fund_type,
            currency=fund_in.currency,
            description=fund_in.description,
            is_active=fund_in.is_active,
            current_balance=fund_in.initial_balance
        )
        self.db.add(fund)
        await self.db.commit()
        await self.db.refresh(fund)
        await cache_service.delete("dashboard:overview")
        return fund

    # Donation Operations
    async def list_donations(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        fund_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None
    ) -> tuple[List[Donation], int]:
        query = select(Donation).options(joinedload(Donation.fund))
        count_query = select(func.count(Donation.id))

        if search:
            filt = or_(
                Donation.donor_name.ilike(f"%{search}%"),
                Donation.receipt_number.ilike(f"%{search}%"),
                Donation.payment_reference.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        if fund_id:
            query = query.where(Donation.fund_id == fund_id)
            count_query = count_query.where(Donation.fund_id == fund_id)

        if category:
            query = query.where(Donation.donation_category == category)
            count_query = count_query.where(Donation.donation_category == category)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(Donation.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create_donation(self, d_in: DonationCreate, created_by: Optional[str] = None) -> Donation:
        if d_in.amount <= 0:
            raise BadRequestException("Donation amount must be greater than zero.")

        fund = await self.get_fund_by_id(d_in.fund_id)
        if not fund or not fund.is_active:
            raise NotFoundException("Active Fund", d_in.fund_id)

        # Generate unique receipt number
        receipt_num = f"RCP-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        
        # 1. Update fund balance atomically
        fund.current_balance = float(fund.current_balance) + float(d_in.amount)

        # 2. Record donation
        donation = Donation(
            receipt_number=receipt_num,
            donor_name="Anonymous Donor" if d_in.is_anonymous else d_in.donor_name.strip(),
            donor_email=d_in.donor_email,
            donor_phone=d_in.donor_phone,
            is_anonymous=d_in.is_anonymous,
            amount=d_in.amount,
            donation_category=d_in.donation_category,
            fund_id=fund.id,
            payment_method=d_in.payment_method,
            payment_reference=d_in.payment_reference,
            status="completed",
            notes=d_in.notes,
            donation_date=d_in.donation_date
        )
        self.db.add(donation)

        # 3. Financial Transaction audit trail
        tx = FinancialTransaction(
            transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            fund_id=fund.id,
            transaction_type="credit",
            category="donation",
            amount=d_in.amount,
            balance_after=fund.current_balance,
            source_module="finance",
            source_reference=receipt_num,
            description=f"{d_in.donation_category.title()} donation received from {donation.donor_name}",
            created_by=created_by,
            transaction_date=d_in.donation_date
        )
        self.db.add(tx)

        # 4. Double-entry ledger
        entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
        # Debit Cash / Bank Account
        debit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1010",
            account_name="Cash & Bank Assets",
            account_type="asset",
            debit=d_in.amount,
            credit=0.0,
            description=f"Received donation {receipt_num}",
            reference=receipt_num,
            entry_date=d_in.donation_date
        )
        # Credit Donation Revenue
        credit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="4010",
            account_name="Donation & Sadaqa Revenue",
            account_type="revenue",
            debit=0.0,
            credit=d_in.amount,
            description=f"Recognized donation revenue {receipt_num}",
            reference=receipt_num,
            entry_date=d_in.donation_date
        )
        self.db.add(debit_entry)
        self.db.add(credit_entry)

        # Commit entire transaction atomically
        await self.db.commit()
        await self.db.refresh(donation)
        await cache_service.delete("dashboard:overview")
        return donation

    # Financial Transactions
    async def list_transactions(
        self,
        skip: int = 0,
        limit: int = 50,
        fund_id: Optional[uuid.UUID] = None,
        transaction_type: Optional[str] = None
    ) -> tuple[List[FinancialTransaction], int]:
        query = select(FinancialTransaction).options(joinedload(FinancialTransaction.fund))
        count_query = select(func.count(FinancialTransaction.id))

        if fund_id:
            query = query.where(FinancialTransaction.fund_id == fund_id)
            count_query = count_query.where(FinancialTransaction.fund_id == fund_id)
        if transaction_type:
            query = query.where(FinancialTransaction.transaction_type == transaction_type)
            count_query = count_query.where(FinancialTransaction.transaction_type == transaction_type)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(FinancialTransaction.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    # Ledger Entries
    async def list_ledger_entries(
        self,
        skip: int = 0,
        limit: int = 50,
        account_type: Optional[str] = None
    ) -> tuple[List[LedgerEntry], int]:
        query = select(LedgerEntry)
        count_query = select(func.count(LedgerEntry.id))

        if account_type:
            query = query.where(LedgerEntry.account_type == account_type)
            count_query = count_query.where(LedgerEntry.account_type == account_type)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(LedgerEntry.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total
