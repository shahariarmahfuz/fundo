import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.sadaqa.schemas import (
    SadaqaCreate,
    SadaqaUpdate,
    SadaqaResponse,
    SadaqaReportResponse
)
from app.modules.sadaqa.models import SadaqaDonation
from app.modules.sadaqa.service import SadaqaService
from app.modules.users.router import require_permission
from app.modules.users.models import User
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/sadaqa", tags=["Sadaqa / Charitable Donations"])


def _to_response(d: SadaqaDonation) -> SadaqaResponse:
    return SadaqaResponse(
        id=d.id,
        receipt_number=d.receipt_number,
        donor_type=d.donor_type,
        member_id=d.member_id,
        member_name=d.member.full_name if d.member else None,
        member_number=d.member.member_number if d.member else None,
        beneficiary_id=d.beneficiary_id,
        beneficiary_name=d.beneficiary.full_name if d.beneficiary else None,
        beneficiary_number=d.beneficiary.beneficiary_number if d.beneficiary else None,
        donor_name=d.donor_name,
        donor_email=d.donor_email,
        donor_phone=d.donor_phone,
        is_anonymous=d.is_anonymous,
        amount=float(d.amount),
        fund_id=d.fund_id,
        fund_name=d.fund.name if d.fund else None,
        fund_code=d.fund.code if d.fund else None,
        donation_date=d.donation_date,
        payment_method=d.payment_method,
        reference=d.reference,
        purpose=d.purpose,
        notes=d.notes,
        status=d.status,
        created_by=d.created_by,
        created_at=d.created_at,
        updated_at=d.updated_at
    )


@router.get("", response_model=PaginatedResponse[SadaqaResponse])
async def list_sadaqa(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    fund_id: Optional[uuid.UUID] = Query(None),
    donor_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("sadaqa.view")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_sadaqa(
        skip=skip,
        limit=page_size,
        fund_id=fund_id,
        donor_type=donor_type,
        search=search,
        start_date=start_date,
        end_date=end_date,
        status=status
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_response(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=SadaqaResponse, status_code=status.HTTP_201_CREATED)
async def create_sadaqa(
    sadaqa_in: SadaqaCreate,
    current_user: User = Depends(require_permission("sadaqa.create")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    donation = await service.create_sadaqa(sadaqa_in, created_by=current_user.full_name)
    return _to_response(donation)


@router.get("/reports", response_model=SadaqaReportResponse)
async def get_sadaqa_reports(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    fund_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(require_permission("sadaqa.reports")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    return await service.get_reports(
        start_date=start_date,
        end_date=end_date,
        fund_id=fund_id
    )


@router.get("/{donation_id}", response_model=SadaqaResponse)
async def get_sadaqa_by_id(
    donation_id: uuid.UUID,
    current_user: User = Depends(require_permission("sadaqa.view")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    donation = await service.get_by_id(donation_id)
    if not donation:
        raise NotFoundException("Sadaqa donation record", donation_id)
    return _to_response(donation)


@router.patch("/{donation_id}", response_model=SadaqaResponse)
async def update_sadaqa(
    donation_id: uuid.UUID,
    update_in: SadaqaUpdate,
    current_user: User = Depends(require_permission("sadaqa.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    donation = await service.update_sadaqa(donation_id, update_in)
    return _to_response(donation)


@router.delete("/{donation_id}")
async def delete_sadaqa(
    donation_id: uuid.UUID,
    current_user: User = Depends(require_permission("sadaqa.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = SadaqaService(db)
    await service.delete_sadaqa(donation_id, cancelled_by=current_user.full_name)
    return {"success": True, "message": "Sadaqa donation record cancelled and financial transactions reversed."}
