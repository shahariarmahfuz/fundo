import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.contributions.schemas import (
    ContributionCreate,
    ContributionResponse,
    MemberDuePreviewResponse,
    MemberContributionLedgerResponse,
    GroupFundResponse,
    BaseContributionRateResponse,
    BaseContributionRateUpdate
)
from app.modules.contributions.service import ContributionService
from app.modules.users.router import require_permission
from app.modules.users.models import User

router = APIRouter(prefix="/contributions", tags=["Contributions"])


@router.get("", response_model=PaginatedResponse[ContributionResponse])
async def list_contributions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    member_id: Optional[uuid.UUID] = Query(None),
    group_id: Optional[uuid.UUID] = Query(None),
    fund_id: Optional[uuid.UUID] = Query(None),
    contribution_month: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("contributions.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_contributions(
        skip=skip,
        limit=page_size,
        member_id=member_id,
        group_id=group_id,
        fund_id=fund_id,
        contribution_month=contribution_month,
        search=search
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    resp_items = [
        ContributionResponse(
            id=c.id,
            receipt_number=c.receipt_number,
            member_id=c.member_id,
            member_name=c.member.full_name if c.member else None,
            member_number=c.member.member_number if c.member else None,
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
        for c in items
    ]

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
async def record_contribution(
    c_in: ContributionCreate,
    current_user: User = Depends(require_permission("contributions.create")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    contrib = await service.create(c_in, recorded_by=current_user.full_name or current_user.email)
    return ContributionResponse(
        id=contrib.id,
        receipt_number=contrib.receipt_number,
        member_id=contrib.member_id,
        member_name=contrib.member.full_name if contrib.member else None,
        member_number=contrib.member.member_number if contrib.member else None,
        group_id=contrib.group_id,
        group_name=contrib.group.name if contrib.group else None,
        group_code=contrib.group.code if contrib.group else None,
        fund_id=contrib.fund_id,
        fund_name=contrib.fund.name if contrib.fund else None,
        amount=float(contrib.amount),
        contribution_month=contrib.contribution_month,
        contribution_type=contrib.contribution_type,
        payment_method=contrib.payment_method,
        payment_reference=contrib.payment_reference,
        notes=contrib.notes,
        status=contrib.status,
        contribution_date=contrib.contribution_date,
        recorded_by=contrib.recorded_by,
        created_at=contrib.created_at,
        updated_at=contrib.updated_at
    )


@router.get("/preview-due", response_model=MemberDuePreviewResponse)
async def get_due_preview(
    member_id: uuid.UUID = Query(...),
    month: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("contributions.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    return await service.get_member_due_preview(member_id=member_id, month=month)


@router.get("/member-ledger/{member_id}", response_model=MemberContributionLedgerResponse)
async def get_member_ledger(
    member_id: uuid.UUID,
    current_user: User = Depends(require_permission("contributions.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    return await service.get_member_ledger(member_id=member_id)


@router.get("/group-fund/{group_id}", response_model=GroupFundResponse)
async def get_group_fund(
    group_id: uuid.UUID,
    month: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("groups.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    return await service.get_group_fund(group_id=group_id, target_month=month)


# Base Contribution Rates Management
@router.get("/rates", response_model=List[BaseContributionRateResponse])
async def list_base_rates(
    current_user: User = Depends(require_permission("settings.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    rates = await service.list_rates()
    return [
        BaseContributionRateResponse(
            id=r.id,
            amount=float(r.amount),
            effective_from=r.effective_from,
            effective_to=r.effective_to,
            description=r.description,
            created_by=r.created_by,
            created_at=r.created_at
        )
        for r in rates
    ]


@router.post("/rates", response_model=BaseContributionRateResponse, status_code=status.HTTP_201_CREATED)
async def update_base_rate(
    rate_in: BaseContributionRateUpdate,
    current_user: User = Depends(require_permission("settings.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = ContributionService(db)
    new_rate = await service.update_base_rate(rate_in, created_by=current_user.full_name or current_user.email)
    return BaseContributionRateResponse(
        id=new_rate.id,
        amount=float(new_rate.amount),
        effective_from=new_rate.effective_from,
        effective_to=new_rate.effective_to,
        description=new_rate.description,
        created_by=new_rate.created_by,
        created_at=new_rate.created_at
    )
