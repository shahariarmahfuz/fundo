import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.contributions.schemas import ContributionCreate, ContributionResponse
from app.modules.contributions.service import ContributionService
from app.modules.users.router import require_permission
from app.modules.users.models import User

router = APIRouter(prefix="/contributions", tags=["Contributions"])


@router.get("", response_model=PaginatedResponse[ContributionResponse])
async def list_contributions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    member_id: Optional[uuid.UUID] = Query(None),
    fund_id: Optional[uuid.UUID] = Query(None),
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
        fund_id=fund_id,
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
            fund_id=c.fund_id,
            fund_name=c.fund.name if c.fund else None,
            amount=float(c.amount),
            contribution_type=c.contribution_type,
            payment_method=c.payment_method,
            payment_reference=c.payment_reference,
            status=c.status,
            contribution_date=c.contribution_date,
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
    contrib = await service.create(c_in, created_by=current_user.full_name)
    return ContributionResponse(
        id=contrib.id,
        receipt_number=contrib.receipt_number,
        member_id=contrib.member_id,
        member_name=contrib.member.full_name if contrib.member else None,
        member_number=contrib.member.member_number if contrib.member else None,
        fund_id=contrib.fund_id,
        fund_name=contrib.fund.name if contrib.fund else None,
        amount=float(contrib.amount),
        contribution_type=contrib.contribution_type,
        payment_method=contrib.payment_method,
        payment_reference=contrib.payment_reference,
        status=contrib.status,
        contribution_date=contrib.contribution_date,
        created_at=contrib.created_at,
        updated_at=contrib.updated_at
    )
