import uuid
from typing import Optional, List, Tuple, Dict, Any
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import joinedload

from app.modules.qard_hasanah.models import QardHasanahLoan, QardHasanahRepayment
from app.modules.qard_hasanah.schemas import (
    QardHasanahCreate,
    QardHasanahUpdate,
    QardHasanahRepaymentCreate,
    QardHasanahReportResponse
)
from app.modules.members.models import Member
from app.modules.groups.models import Group
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.cache import cache_service


class QardHasanahService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, loan_id: uuid.UUID) -> Optional[QardHasanahLoan]:
        result = await self.db.execute(
            select(QardHasanahLoan)
            .options(
                joinedload(QardHasanahLoan.borrower),
                joinedload(QardHasanahLoan.group),
                joinedload(QardHasanahLoan.fund)
            )
            .where(QardHasanahLoan.id == loan_id)
        )
        return result.scalar_one_or_none()

    async def list_loans(
        self,
        skip: int = 0,
        limit: int = 50,
        borrower_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[QardHasanahLoan], int]:
        query = select(QardHasanahLoan).options(
            joinedload(QardHasanahLoan.borrower),
            joinedload(QardHasanahLoan.group),
            joinedload(QardHasanahLoan.fund)
        )
        count_query = select(func.count(QardHasanahLoan.id))

        if borrower_id:
            query = query.where(QardHasanahLoan.borrower_id == borrower_id)
            count_query = count_query.where(QardHasanahLoan.borrower_id == borrower_id)

        if group_id:
            query = query.where(QardHasanahLoan.group_id == group_id)
            count_query = count_query.where(QardHasanahLoan.group_id == group_id)

        if status and status != "all":
            query = query.where(QardHasanahLoan.status == status)
            count_query = count_query.where(QardHasanahLoan.status == status)

        if search:
            search_filt = or_(
                QardHasanahLoan.loan_number.ilike(f"%{search}%"),
                QardHasanahLoan.purpose.ilike(f"%{search}%"),
                QardHasanahLoan.notes.ilike(f"%{search}%")
            )
            query = query.where(search_filt)
            count_query = count_query.where(search_filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(QardHasanahLoan.created_at)).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create_and_disburse(
        self,
        loan_in: QardHasanahCreate,
        created_by: Optional[str] = None
    ) -> QardHasanahLoan:
        if loan_in.principal_amount <= 0:
            raise BadRequestException("Principal amount must be strictly positive.")

        # 1. Verify borrower
        res_m = await self.db.execute(select(Member).where(Member.id == loan_in.borrower_id))
        borrower = res_m.scalar_one_or_none()
        if not borrower:
            raise NotFoundException("Member borrower", loan_in.borrower_id)

        # 2. Verify group if provided
        group = None
        if loan_in.group_id:
            res_g = await self.db.execute(select(Group).where(Group.id == loan_in.group_id))
            group = res_g.scalar_one_or_none()
            if not group:
                raise NotFoundException("Savings group", loan_in.group_id)
        elif borrower.group_id:
            # Default to borrower's associated group
            loan_in.group_id = borrower.group_id

        # 3. Verify capital fund
        res_f = await self.db.execute(select(Fund).where(Fund.id == loan_in.fund_id))
        fund = res_f.scalar_one_or_none()
        if not fund or not fund.is_active:
            raise NotFoundException("Active capital fund", loan_in.fund_id)

        is_active = loan_in.status == "active"
        if is_active and float(fund.current_balance) < float(loan_in.principal_amount):
            raise BadRequestException(
                f"Insufficient capital in fund '{fund.name}'. Available: {fund.current_balance}, Required: {loan_in.principal_amount}"
            )

        # 4. Compute installment amount
        inst_count = max(1, loan_in.installment_count)
        installment_amt = loan_in.installment_amount or round(float(loan_in.principal_amount) / inst_count, 2)
        disburse_date = loan_in.disbursement_date or date.today()
        start_date = loan_in.repayment_start_date or (disburse_date + relativedelta(months=1))
        loan_number = f"QH-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        try:
            # If active, disburse from fund
            if is_active:
                fund.current_balance = float(fund.current_balance) - float(loan_in.principal_amount)

            loan = QardHasanahLoan(
                loan_number=loan_number,
                borrower_id=borrower.id,
                group_id=loan_in.group_id,
                fund_id=fund.id,
                principal_amount=loan_in.principal_amount,
                total_repaid=0.0,
                disbursement_date=disburse_date,
                repayment_start_date=start_date,
                repayment_schedule=loan_in.repayment_schedule,
                installment_amount=installment_amt,
                installment_count=inst_count,
                purpose=loan_in.purpose,
                notes=loan_in.notes,
                status=loan_in.status or "active",
                created_by=created_by
            )
            self.db.add(loan)

            if is_active:
                # Audit financial transaction
                tx = FinancialTransaction(
                    transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                    fund_id=fund.id,
                    transaction_type="debit",
                    category="qard_hasanah_disbursement",
                    amount=loan_in.principal_amount,
                    balance_after=fund.current_balance,
                    source_module="qard_hasanah",
                    source_reference=loan_number,
                    description=f"Disbursed interest-free Qard Hasanah {loan_number} to {borrower.full_name} ({borrower.member_number})",
                    created_by=created_by,
                    transaction_date=disburse_date
                )
                self.db.add(tx)

                # Double-entry ledger
                entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
                debit_entry = LedgerEntry(
                    entry_number=entry_group,
                    account_code="1025",
                    account_name="Qard Hasanah Receivables",
                    account_type="asset",
                    debit=loan_in.principal_amount,
                    credit=0.0,
                    description=f"Qard Hasanah disbursed {loan_number}",
                    reference=loan_number,
                    entry_date=disburse_date
                )
                credit_entry = LedgerEntry(
                    entry_number=entry_group,
                    account_code="1010",
                    account_name="Cash & Bank Assets",
                    account_type="asset",
                    debit=0.0,
                    credit=loan_in.principal_amount,
                    description=f"Cash paid for Qard Hasanah {loan_number}",
                    reference=loan_number,
                    entry_date=disburse_date
                )
                self.db.add(debit_entry)
                self.db.add(credit_entry)

            await self.db.commit()
            await self.db.refresh(loan)
            await cache_service.delete("dashboard:overview")
            return await self.get_by_id(loan.id)
        except Exception:
            await self.db.rollback()
            raise

    async def update_loan(
        self,
        loan_id: uuid.UUID,
        update_in: QardHasanahUpdate
    ) -> QardHasanahLoan:
        loan = await self.get_by_id(loan_id)
        if not loan:
            raise NotFoundException("Qard Hasanah loan", loan_id)

        if update_in.purpose is not None:
            loan.purpose = update_in.purpose
        if update_in.notes is not None:
            loan.notes = update_in.notes
        if update_in.status is not None:
            loan.status = update_in.status
        if update_in.repayment_schedule is not None:
            loan.repayment_schedule = update_in.repayment_schedule
        if update_in.installment_amount is not None:
            loan.installment_amount = update_in.installment_amount
        if update_in.installment_count is not None:
            loan.installment_count = update_in.installment_count

        await self.db.commit()
        await self.db.refresh(loan)
        return await self.get_by_id(loan.id)

    async def delete_or_cancel(self, loan_id: uuid.UUID) -> bool:
        loan = await self.get_by_id(loan_id)
        if not loan:
            raise NotFoundException("Qard Hasanah loan", loan_id)

        if float(loan.total_repaid) > 0:
            raise BadRequestException(
                "Cannot delete or cancel a Qard Hasanah loan with active repayment transactions."
            )

        try:
            # If active, return principal to fund
            if loan.status == "active":
                fund = await self.db.get(Fund, loan.fund_id)
                if fund:
                    fund.current_balance = float(fund.current_balance) + float(loan.principal_amount)
                    tx = FinancialTransaction(
                        transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                        fund_id=fund.id,
                        transaction_type="credit",
                        category="qard_hasanah_cancellation",
                        amount=loan.principal_amount,
                        balance_after=fund.current_balance,
                        source_module="qard_hasanah",
                        source_reference=loan.loan_number,
                        description=f"Cancelled Qard Hasanah {loan.loan_number}; capital restored",
                        transaction_date=date.today()
                    )
                    self.db.add(tx)

            await self.db.delete(loan)
            await self.db.commit()
            await cache_service.delete("dashboard:overview")
            return True
        except Exception:
            await self.db.rollback()
            raise

    async def record_repayment(
        self,
        rep_in: QardHasanahRepaymentCreate,
        created_by: Optional[str] = None
    ) -> QardHasanahRepayment:
        if rep_in.amount <= 0:
            raise BadRequestException("Repayment amount must be strictly positive.")

        loan = await self.get_by_id(rep_in.loan_id)
        if not loan:
            raise NotFoundException("Qard Hasanah loan", rep_in.loan_id)

        fund = await self.db.get(Fund, loan.fund_id)
        if not fund:
            raise NotFoundException("Target fund", loan.fund_id)

        # STRICT PRINCIPAL ENFORCEMENT
        # Outstanding principal = Principal - Total Repaid
        outstanding_principal = round(float(loan.principal_amount) - float(loan.total_repaid), 2)
        if outstanding_principal <= 0:
            raise BadRequestException("This Qard Hasanah loan is already fully settled.")

        if round(float(rep_in.amount), 2) > outstanding_principal:
            raise BadRequestException(
                f"Repayment amount ({rep_in.amount}) cannot exceed the outstanding principal balance ({outstanding_principal})."
            )

        rep_receipt = f"QHR-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        pay_date = rep_in.payment_date or date.today()

        try:
            # 1. Update loan total_repaid and status
            new_total_repaid = round(float(loan.total_repaid) + float(rep_in.amount), 2)
            loan.total_repaid = new_total_repaid

            if loan.total_repaid >= float(loan.principal_amount):
                loan.status = "fully_repaid"
            else:
                loan.status = "partially_repaid"

            # 2. Return capital to Fund
            fund.current_balance = float(fund.current_balance) + float(rep_in.amount)

            # 3. Create repayment record
            repayment = QardHasanahRepayment(
                receipt_number=rep_receipt,
                loan_id=loan.id,
                amount=rep_in.amount,
                payment_date=pay_date,
                payment_method=rep_in.payment_method,
                reference=rep_in.reference,
                notes=rep_in.notes,
                created_by=created_by
            )
            self.db.add(repayment)

            # 4. Financial Transaction audit trail (credit to fund)
            tx = FinancialTransaction(
                transaction_number=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                fund_id=fund.id,
                transaction_type="credit",
                category="qard_hasanah_repayment",
                amount=rep_in.amount,
                balance_after=fund.current_balance,
                source_module="qard_hasanah",
                source_reference=rep_receipt,
                description=f"Interest-free repayment for Qard Hasanah {loan.loan_number} from {loan.borrower.full_name}",
                created_by=created_by,
                transaction_date=pay_date
            )
            self.db.add(tx)

            # 5. Double-entry ledger
            entry_group = f"JRN-{uuid.uuid4().hex[:8].upper()}"
            debit_entry = LedgerEntry(
                entry_number=entry_group,
                account_code="1010",
                account_name="Cash & Bank Assets",
                account_type="asset",
                debit=rep_in.amount,
                credit=0.0,
                description=f"Qard Hasanah repayment received {rep_receipt}",
                reference=rep_receipt,
                entry_date=pay_date
            )
            credit_entry = LedgerEntry(
                entry_number=entry_group,
                account_code="1025",
                account_name="Qard Hasanah Receivables",
                account_type="asset",
                debit=0.0,
                credit=rep_in.amount,
                description=f"Qard Hasanah principal receivable reduced {rep_receipt}",
                reference=rep_receipt,
                entry_date=pay_date
            )
            self.db.add(debit_entry)
            self.db.add(credit_entry)

            await self.db.commit()
            await self.db.refresh(repayment)
            await cache_service.delete("dashboard:overview")
            return repayment
        except Exception:
            await self.db.rollback()
            raise

    async def list_repayments(
        self,
        loan_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> Tuple[List[QardHasanahRepayment], int]:
        query = select(QardHasanahRepayment).options(
            joinedload(QardHasanahRepayment.loan).joinedload(QardHasanahLoan.borrower)
        )
        count_query = select(func.count(QardHasanahRepayment.id))

        if loan_id:
            query = query.where(QardHasanahRepayment.loan_id == loan_id)
            count_query = count_query.where(QardHasanahRepayment.loan_id == loan_id)

        if search:
            search_filt = or_(
                QardHasanahRepayment.receipt_number.ilike(f"%{search}%"),
                QardHasanahRepayment.reference.ilike(f"%{search}%"),
                QardHasanahRepayment.notes.ilike(f"%{search}%")
            )
            query = query.where(search_filt)
            count_query = count_query.where(search_filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(desc(QardHasanahRepayment.payment_date), desc(QardHasanahRepayment.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_reports(self) -> QardHasanahReportResponse:
        # Load all loans with relations for aggregation
        query = select(QardHasanahLoan).options(
            joinedload(QardHasanahLoan.borrower),
            joinedload(QardHasanahLoan.group)
        )
        res = await self.db.execute(query)
        loans = list(res.scalars().all())

        total_issued = 0.0
        total_repaid = 0.0
        active_cnt = 0
        partially_cnt = 0
        fully_cnt = 0
        pending_cnt = 0
        cancelled_cnt = 0
        overdue_cnt = 0

        today = date.today()
        borrower_map: Dict[str, Dict[str, Any]] = {}
        group_map: Dict[str, Dict[str, Any]] = {}

        for l in loans:
            p = float(l.principal_amount)
            r = float(l.total_repaid)
            out = max(0.0, round(p - r, 2))

            if l.status != "cancelled":
                total_issued += p
                total_repaid += r

            if l.status == "active":
                active_cnt += 1
            elif l.status == "partially_repaid":
                partially_cnt += 1
            elif l.status == "fully_repaid":
                fully_cnt += 1
            elif l.status == "pending":
                pending_cnt += 1
            elif l.status == "cancelled":
                cancelled_cnt += 1

            # Check if overdue (active/partially_repaid and repayment_start_date has passed)
            if l.status in ("active", "partially_repaid") and l.repayment_start_date and l.repayment_start_date < today:
                # overdue if outstanding > 0
                if out > 0:
                    overdue_cnt += 1

            # Borrower summary
            b_name = l.borrower.full_name if l.borrower else "Unknown"
            b_code = l.borrower.member_number if l.borrower else "—"
            if b_name not in borrower_map:
                borrower_map[b_name] = {
                    "borrower_name": b_name,
                    "member_number": b_code,
                    "loans_count": 0,
                    "total_principal": 0.0,
                    "total_repaid": 0.0,
                    "outstanding": 0.0
                }
            borrower_map[b_name]["loans_count"] += 1
            borrower_map[b_name]["total_principal"] += p
            borrower_map[b_name]["total_repaid"] += r
            borrower_map[b_name]["outstanding"] += out

            # Group summary
            g_name = l.group.name if l.group else "Direct / Unassigned"
            g_code = l.group.code if l.group else "—"
            if g_name not in group_map:
                group_map[g_name] = {
                    "group_name": g_name,
                    "group_code": g_code,
                    "loans_count": 0,
                    "total_principal": 0.0,
                    "total_repaid": 0.0,
                    "outstanding": 0.0
                }
            group_map[g_name]["loans_count"] += 1
            group_map[g_name]["total_principal"] += p
            group_map[g_name]["total_repaid"] += r
            group_map[g_name]["outstanding"] += out

        total_outstanding = max(0.0, round(total_issued - total_repaid, 2))

        return QardHasanahReportResponse(
            total_issued_amount=round(total_issued, 2),
            total_principal_outstanding=round(total_outstanding, 2),
            total_principal_repaid=round(total_repaid, 2),
            total_loans_count=len(loans),
            active_count=active_cnt,
            partially_repaid_count=partially_cnt,
            fully_repaid_count=fully_cnt,
            pending_count=pending_cnt,
            cancelled_count=cancelled_cnt,
            overdue_count=overdue_cnt,
            borrower_summary=list(borrower_map.values()),
            group_summary=list(group_map.values())
        )
