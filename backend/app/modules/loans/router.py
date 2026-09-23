import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.loans.schemas import (
    LoanCreate,
    LoanResponse,
    LoanRepaymentCreate,
    LoanRepaymentResponse
)
from app.modules.loans.service import LoanService
from app.modules.users.router import require_roles
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/loans", tags=["Loans"])


def _to_loan_response(l) -> LoanResponse:
    outstanding = round(float(l.total_repayable) - float(l.total_repaid), 2)
    return LoanResponse(
        id=l.id,
        loan_number=l.loan_number,
        member_id=l.member_id,
        member_name=l.member.full_name if l.member else None,
        member_number=l.member.member_number if l.member else None,
        fund_id=l.fund_id,
        fund_name=l.fund.name if l.fund else None,
        principal_amount=float(l.principal_amount),
        interest_rate=float(l.interest_rate),
        term_months=l.term_months,
        monthly_installment=float(l.monthly_installment),
        total_repayable=float(l.total_repayable),
        total_repaid=float(l.total_repaid),
        outstanding_balance=max(0.0, outstanding),
        status=l.status,
        disbursement_date=l.disbursement_date,
        due_date=l.due_date,
        purpose=l.purpose,
        created_at=l.created_at,
        updated_at=l.updated_at
    )


@router.get("", response_model=PaginatedResponse[LoanResponse])
async def list_loans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    member_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = LoanService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_loans(
        skip=skip,
        limit=page_size,
        member_id=member_id,
        status=status,
        search=search
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_loan_response(l) for l in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    loan_in: LoanCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    service = LoanService(db)
    loan = await service.create_and_disburse(loan_in, created_by=current_user.full_name)
    return _to_loan_response(loan)


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = LoanService(db)
    loan = await service.get_by_id(loan_id)
    if not loan:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Loan", loan_id)
    return _to_loan_response(loan)


@router.post("/repayments", response_model=LoanRepaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_loan_repayment(
    rep_in: LoanRepaymentCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    service = LoanService(db)
    repayment = await service.record_repayment(rep_in, created_by=current_user.full_name)
    return LoanRepaymentResponse(
        id=repayment.id,
        receipt_number=repayment.receipt_number,
        loan_id=repayment.loan_id,
        amount=float(repayment.amount),
        payment_method=repayment.payment_method,
        payment_reference=repayment.payment_reference,
        repayment_date=repayment.repayment_date,
        notes=repayment.notes,
        created_at=repayment.created_at
    )
