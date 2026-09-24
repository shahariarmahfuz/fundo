import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.qard_hasanah.schemas import (
    QardHasanahCreate,
    QardHasanahUpdate,
    QardHasanahResponse,
    QardHasanahRepaymentCreate,
    QardHasanahRepaymentResponse,
    QardHasanahReportResponse
)
from app.modules.qard_hasanah.models import QardHasanahLoan, QardHasanahRepayment
from app.modules.qard_hasanah.service import QardHasanahService
from app.modules.users.router import require_permission
from app.modules.users.models import User
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/qard-hasanah", tags=["Qard Hasanah (Interest-Free Loans)"])


def _to_response(l: QardHasanahLoan) -> QardHasanahResponse:
    outstanding = max(0.0, round(float(l.principal_amount) - float(l.total_repaid), 2))
    return QardHasanahResponse(
        id=l.id,
        loan_number=l.loan_number,
        borrower_id=l.borrower_id,
        borrower_name=l.borrower.full_name if l.borrower else None,
        borrower_number=l.borrower.member_number if l.borrower else None,
        group_id=l.group_id,
        group_name=l.group.name if l.group else None,
        group_code=l.group.code if l.group else None,
        fund_id=l.fund_id,
        fund_name=l.fund.name if l.fund else None,
        principal_amount=float(l.principal_amount),
        total_repaid=float(l.total_repaid),
        outstanding_principal=outstanding,
        disbursement_date=l.disbursement_date,
        repayment_start_date=l.repayment_start_date,
        repayment_schedule=l.repayment_schedule,
        installment_amount=float(l.installment_amount),
        installment_count=l.installment_count,
        purpose=l.purpose,
        notes=l.notes,
        status=l.status,
        created_by=l.created_by,
        created_at=l.created_at,
        updated_at=l.updated_at
    )


def _to_rep_response(r: QardHasanahRepayment) -> QardHasanahRepaymentResponse:
    return QardHasanahRepaymentResponse(
        id=r.id,
        receipt_number=r.receipt_number,
        loan_id=r.loan_id,
        loan_number=r.loan.loan_number if r.loan else None,
        borrower_name=r.loan.borrower.full_name if (r.loan and r.loan.borrower) else None,
        borrower_number=r.loan.borrower.member_number if (r.loan and r.loan.borrower) else None,
        amount=float(r.amount),
        payment_date=r.payment_date,
        payment_method=r.payment_method,
        reference=r.reference,
        notes=r.notes,
        created_by=r.created_by,
        created_at=r.created_at
    )


@router.get("", response_model=PaginatedResponse[QardHasanahResponse])
async def list_loans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    borrower_id: Optional[uuid.UUID] = Query(None),
    group_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("qard_hasanah.view")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_loans(
        skip=skip,
        limit=page_size,
        borrower_id=borrower_id,
        group_id=group_id,
        status=status,
        search=search
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_response(l) for l in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=QardHasanahResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    loan_in: QardHasanahCreate,
    current_user: User = Depends(require_permission("qard_hasanah.create")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    loan = await service.create_and_disburse(loan_in, created_by=current_user.full_name)
    return _to_response(loan)


@router.get("/reports", response_model=QardHasanahReportResponse)
async def get_reports(
    current_user: User = Depends(require_permission("qard_hasanah.reports")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    return await service.get_reports()


@router.get("/repayments", response_model=PaginatedResponse[QardHasanahRepaymentResponse])
async def list_all_repayments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("qard_hasanah.view")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_repayments(
        loan_id=None,
        skip=skip,
        limit=page_size,
        search=search
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_rep_response(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{loan_id}", response_model=QardHasanahResponse)
async def get_loan(
    loan_id: uuid.UUID,
    current_user: User = Depends(require_permission("qard_hasanah.view")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    loan = await service.get_by_id(loan_id)
    if not loan:
        raise NotFoundException("Qard Hasanah loan", loan_id)
    return _to_response(loan)


@router.patch("/{loan_id}", response_model=QardHasanahResponse)
async def update_loan(
    loan_id: uuid.UUID,
    update_in: QardHasanahUpdate,
    current_user: User = Depends(require_permission("qard_hasanah.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    loan = await service.update_loan(loan_id, update_in)
    return _to_response(loan)


@router.delete("/{loan_id}")
async def delete_loan(
    loan_id: uuid.UUID,
    current_user: User = Depends(require_permission("qard_hasanah.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    await service.delete_or_cancel(loan_id)
    return {"success": True, "message": "Qard Hasanah loan record removed or cancelled."}


@router.get("/{loan_id}/repayments", response_model=PaginatedResponse[QardHasanahRepaymentResponse])
async def list_loan_repayments(
    loan_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission("qard_hasanah.view")),
    db: AsyncSession = Depends(get_db)
):
    service = QardHasanahService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_repayments(
        loan_id=loan_id,
        skip=skip,
        limit=page_size
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_rep_response(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/{loan_id}/repayments", response_model=QardHasanahRepaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_loan_repayment(
    loan_id: uuid.UUID,
    rep_in: QardHasanahRepaymentCreate,
    current_user: User = Depends(require_permission("qard_hasanah.repayment")),
    db: AsyncSession = Depends(get_db)
):
    # Ensure URL loan_id matches body loan_id
    rep_in.loan_id = loan_id
    service = QardHasanahService(db)
    rep = await service.record_repayment(rep_in, created_by=current_user.full_name)
    return _to_rep_response(rep)
