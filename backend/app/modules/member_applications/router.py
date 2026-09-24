import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.core.exceptions import NotFoundException
from app.modules.member_applications.schemas import (
    PublicMemberApplicationCreate,
    PublicMemberApplicationResponse,
    MemberApplicationListResponse,
    MemberApplicationDetailResponse,
    MemberApplicationApproveRequest,
    MemberApplicationRejectRequest
)
from app.modules.member_applications.service import MemberApplicationService
from app.modules.users.router import require_permission
from app.modules.users.models import User

# Admin Management Router
admin_router = APIRouter(prefix="/member-applications", tags=["Member Applications"])

# Public Facing Router
public_router = APIRouter(prefix="/public/member-applications", tags=["Public Member Applications"])


def _to_list_response(app) -> MemberApplicationListResponse:
    return MemberApplicationListResponse(
        id=app.id,
        application_reference=app.application_reference,
        full_name=app.full_name,
        phone=app.phone,
        email=app.email,
        area=app.area,
        occupation=app.occupation,
        status=app.status,
        submitted_at=app.submitted_at,
        reviewed_at=app.reviewed_at,
        reviewed_by_name=app.reviewed_by.full_name if app.reviewed_by else None
    )


def _to_detail_response(app) -> MemberApplicationDetailResponse:
    return MemberApplicationDetailResponse(
        id=app.id,
        application_reference=app.application_reference,
        full_name=app.full_name,
        date_of_birth=app.date_of_birth,
        gender=app.gender,
        phone=app.phone,
        email=app.email,
        address=app.address,
        area=app.area,
        occupation=app.occupation,
        emergency_contact=app.emergency_contact,
        reason_for_joining=app.reason_for_joining,
        additional_info=app.additional_info,
        status=app.status,
        submitted_at=app.submitted_at,
        reviewed_at=app.reviewed_at,
        reviewed_by_id=app.reviewed_by_id,
        reviewed_by_name=app.reviewed_by.full_name if app.reviewed_by else None,
        review_notes=app.review_notes,
        rejection_reason=app.rejection_reason,
        member_id=app.member_id,
        member_number=app.member.member_number if app.member else None,
        created_at=app.created_at,
        updated_at=app.updated_at
    )


# ==================== Public Endpoints ====================

@public_router.post(
    "",
    response_model=PublicMemberApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Public Membership Application"
)
async def submit_public_application(
    app_in: PublicMemberApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    app = await service.create_public_application(app_in)
    return PublicMemberApplicationResponse(
        success=True,
        message="Your membership application has been submitted successfully.",
        application_reference=app.application_reference,
        submitted_at=app.submitted_at
    )


# ==================== Protected Admin Endpoints ====================

@admin_router.get(
    "",
    response_model=PaginatedResponse[MemberApplicationListResponse],
    summary="List Member Applications"
)
async def list_member_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(require_permission("member_applications.view")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_applications(
        skip=skip,
        limit=page_size,
        search=search,
        status=status,
        from_date=from_date,
        to_date=to_date,
        sort_order=sort_order
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_list_response(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@admin_router.get(
    "/{app_id}",
    response_model=MemberApplicationDetailResponse,
    summary="Get Application Details"
)
async def get_member_application(
    app_id: uuid.UUID,
    current_user: User = Depends(require_permission("member_applications.view")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    app = await service.get_by_id(app_id)
    if not app:
        raise NotFoundException("MemberApplication", app_id)
    return _to_detail_response(app)


@admin_router.post(
    "/{app_id}/approve",
    response_model=MemberApplicationDetailResponse,
    summary="Approve Member Application"
)
async def approve_member_application(
    app_id: uuid.UUID,
    req: MemberApplicationApproveRequest,
    current_user: User = Depends(require_permission("member_applications.approve")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    app = await service.approve_application(
        app_id=app_id,
        reviewer_id=current_user.id,
        req=req
    )
    return _to_detail_response(app)


@admin_router.post(
    "/{app_id}/reject",
    response_model=MemberApplicationDetailResponse,
    summary="Reject Member Application"
)
async def reject_member_application(
    app_id: uuid.UUID,
    req: MemberApplicationRejectRequest,
    current_user: User = Depends(require_permission("member_applications.reject")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    app = await service.reject_application(
        app_id=app_id,
        reviewer_id=current_user.id,
        req=req
    )
    return _to_detail_response(app)


@admin_router.delete(
    "/{app_id}",
    summary="Delete Member Application"
)
async def delete_member_application(
    app_id: uuid.UUID,
    current_user: User = Depends(require_permission("member_applications.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberApplicationService(db)
    await service.delete_application(app_id)
    return {"success": True, "detail": "Member application deleted successfully"}
