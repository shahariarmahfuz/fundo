from typing import Optional, List
import uuid
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import joinedload

from app.modules.loans.models import Loan, LoanRepayment
from app.modules.loans.schemas import LoanCreate, LoanRepaymentCreate
from app.modules.members.models import Member
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.cache import cache_service


class LoanService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, loan_id: uuid.UUID) -> Optional[Loan]:
        result = await self.db.execute(
            select(Loan)
            .options(joinedload(Loan.member), joinedload(Loan.fund))
            .where(Loan.id == loan_id)
        )
        return result.scalar_one_or_none()

    async def list_loans(
        self,
        skip: int = 0,
        limit: int = 50,
        member_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[Loan], int]:
        query = select(Loan).options(
            joinedload(Loan.member),
            joinedload(Loan.fund)
        )
        count_query = select(func.count(Loan.id))

        if member_id:
            query = query.where(Loan.member_id == member_id)
            count_query = count_query.where(Loan.member_id == member_id)

        if status:
            query = query.where(Loan.status == status)
            count_query = count_query.where(Loan.status == status)

        if search:
            filt = or_(
                Loan.loan_number.ilike(f"%{search}%"),
                Loan.purpose.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(Loan.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create_and_disburse(self, loan_in: LoanCreate, created_by: Optional[str] = None) -> Loan:
        if loan_in.principal_amount <= 0:
            raise BadRequestException("Principal amount must be positive.")
        if loan_in.term_months <= 0:
            raise BadRequestException("Term months must be positive.")

        # Check member
        res_m = await self.db.execute(select(Member).where(Member.id == loan_in.member_id))
        member = res_m.scalar_one_or_none()
        if not member:
            raise NotFoundException("Member", loan_in.member_id)

        # Check fund (ensure sufficient pool balance)
        res_f = await self.db.execute(select(Fund).where(Fund.id == loan_in.fund_id))
        fund = res_f.scalar_one_or_none()
        if not fund or not fund.is_active:
            raise NotFoundException("Active Loan Fund", loan_in.fund_id)

        if float(fund.current_balance) < float(loan_in.principal_amount):
            raise BadRequestException(f"Insufficient funds in '{fund.name}'. Available: {fund.current_balance}")

        # Compute repayment schedule
        interest = float(loan_in.principal_amount) * (float(loan_in.interest_rate) / 100.0)
        total_repayable = round(float(loan_in.principal_amount) + interest, 2)
        monthly_installment = round(total_repayable / loan_in.term_months, 2)
        disburse_date = loan_in.disbursement_date or date.today()
        # approximate due date
        due_date = disburse_date + relativedelta(months=loan_in.term_months)
        loan_num = f"LN-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        # 1. Deduct fund balance
        fund.current_balance = float(fund.current_balance) - float(loan_in.principal_amount)

        # 2. Record loan
        loan = Loan(
            loan_number=loan_num,
            member_id=member.id,
            fund_id=fund.id,
            principal_amount=loan_in.principal_amount,
            interest_rate=loan_in.interest_rate,
            term_months=loan_in.term_months,
            monthly_installment=monthly_installment,
            total_repayable=total_repayable,
            total_repaid=0.0,
            status="active",
            disbursement_date=disburse_date,
            due_date=due_date,
            purpose=loan_in.purpose
        )
        self.db.add(loan)

        # 3. Financial Transaction audit trail (debit from fund)
        tx = FinancialTransaction(
            transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            fund_id=fund.id,
            transaction_type="debit",
            category="loan_disbursement",
            amount=loan_in.principal_amount,
            balance_after=fund.current_balance,
            source_module="loans",
            source_reference=loan_num,
            description=f"Disbursed loan {loan_num} to {member.full_name} ({member.member_number})",
            created_by=created_by,
            transaction_date=disburse_date
        )
        self.db.add(tx)

        # 4. Double-entry ledger
        entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
        # Debit Loan Receivable Asset
        debit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1020",
            account_name="Loan Receivables",
            account_type="asset",
            debit=loan_in.principal_amount,
            credit=0.0,
            description=f"Loan disbursed {loan_num}",
            reference=loan_num,
            entry_date=disburse_date
        )
        # Credit Cash/Bank Asset
        credit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1010",
            account_name="Cash & Bank Assets",
            account_type="asset",
            debit=0.0,
            credit=loan_in.principal_amount,
            description=f"Cash paid for loan {loan_num}",
            reference=loan_num,
            entry_date=disburse_date
        )
        self.db.add(debit_entry)
        self.db.add(credit_entry)

        await self.db.commit()
        await self.db.refresh(loan)
        await cache_service.delete("dashboard:overview")
        return await self.get_by_id(loan.id)

    async def record_repayment(self, rep_in: LoanRepaymentCreate, created_by: Optional[str] = None) -> LoanRepayment:
        if rep_in.amount <= 0:
            raise BadRequestException("Repayment amount must be positive.")

        loan = await self.get_by_id(rep_in.loan_id)
        if not loan:
            raise NotFoundException("Loan", rep_in.loan_id)

        fund = await self.db.get(Fund, loan.fund_id)
        if not fund:
            raise NotFoundException("Fund", loan.fund_id)

        rep_receipt = f"LNR-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"

        # 1. Update loan total_repaid and status
        new_total_repaid = round(float(loan.total_repaid) + float(rep_in.amount), 2)
        loan.total_repaid = new_total_repaid
        if loan.total_repaid >= float(loan.total_repayable):
            loan.status = "completed"

        # 2. Return cash back to Fund
        fund.current_balance = float(fund.current_balance) + float(rep_in.amount)

        # 3. Create repayment record
        repayment = LoanRepayment(
            receipt_number=rep_receipt,
            loan_id=loan.id,
            amount=rep_in.amount,
            payment_method=rep_in.payment_method,
            payment_reference=rep_in.payment_reference,
            repayment_date=rep_in.repayment_date,
            notes=rep_in.notes
        )
        self.db.add(repayment)

        # 4. Financial Transaction audit trail (credit to fund)
        tx = FinancialTransaction(
            transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            fund_id=fund.id,
            transaction_type="credit",
            category="loan_repayment",
            amount=rep_in.amount,
            balance_after=fund.current_balance,
            source_module="loans",
            source_reference=rep_receipt,
            description=f"Repayment for loan {loan.loan_number} from {loan.member.full_name}",
            created_by=created_by,
            transaction_date=rep_in.repayment_date
        )
        self.db.add(tx)

        # 5. Ledger entries
        entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
        debit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1010",
            account_name="Cash & Bank Assets",
            account_type="asset",
            debit=rep_in.amount,
            credit=0.0,
            description=f"Loan repayment received {rep_receipt}",
            reference=rep_receipt,
            entry_date=rep_in.repayment_date
        )
        credit_entry = LedgerEntry(
            entry_number=entry_group,
            account_code="1020",
            account_name="Loan Receivables",
            account_type="asset",
            debit=0.0,
            credit=rep_in.amount,
            description=f"Loan receivable reduced {rep_receipt}",
            reference=rep_receipt,
            entry_date=rep_in.repayment_date
        )
        self.db.add(debit_entry)
        self.db.add(credit_entry)

        await self.db.commit()
        await self.db.refresh(repayment)
        await cache_service.delete("dashboard:overview")
        return repayment
