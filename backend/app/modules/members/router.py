import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.members.schemas import MemberCreate, MemberUpdate, MemberResponse
from app.modules.members.service import MemberService
from app.modules.users.router import require_permission
from app.modules.users.models import User
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/members", tags=["Members"])


def _to_response(m) -> MemberResponse:
    return MemberResponse(
        id=m.id,
        member_number=m.member_number,
        full_name=m.full_name,
        group_id=m.group_id,
        group_name=m.group.name if m.group else None,
        join_date=m.join_date,
        membership_status=m.membership_status,

        father_name=m.father_name,
        mother_name=m.mother_name,
        date_of_birth=m.date_of_birth,
        gender=m.gender,
        national_id=m.national_id,
        occupation=m.occupation,
        education=m.education,
        blood_group=m.blood_group,
        marital_status=m.marital_status,
        phone=m.phone,
        alt_phone=m.alt_phone,
        email=m.email,
        present_address=m.present_address,
        permanent_address=m.permanent_address,
        address=m.present_address or m.address,

        emergency_name=m.emergency_name,
        emergency_relation=m.emergency_relation,
        emergency_phone=m.emergency_phone,

        reference_name=m.reference_name,
        reference_phone=m.reference_phone,
        reference_relation=m.reference_relation,

        commitment=m.commitment,
        photo_url=m.photo_url,
        signature_url=m.signature_url,
        document_type=m.document_type,
        nid_front_url=m.nid_front_url,
        nid_back_url=m.nid_back_url,

        reason_for_joining=m.reason_for_joining,
        notes=m.notes,

        created_at=m.created_at,
        updated_at=m.updated_at
    )


@router.get("", response_model=PaginatedResponse[MemberResponse])
async def list_members(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    group_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("members.view")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_members(
        skip=skip,
        limit=page_size,
        search=search,
        group_id=group_id,
        status=status
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[_to_response(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member(
    member_in: MemberCreate,
    current_user: User = Depends(require_permission("members.create")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    member = await service.create(member_in)
    return _to_response(member)


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: uuid.UUID,
    current_user: User = Depends(require_permission("members.view")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    member = await service.get_by_id(member_id)
    if not member:
        raise NotFoundException("Member", member_id)
    return _to_response(member)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: uuid.UUID,
    member_in: MemberUpdate,
    current_user: User = Depends(require_permission("members.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    member = await service.update(member_id, member_in)
    return _to_response(member)


@router.delete("/{member_id}")
async def delete_member(
    member_id: uuid.UUID,
    current_user: User = Depends(require_permission("members.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    member = await service.get_by_id(member_id)
    if not member:
        raise NotFoundException("Member", member_id)
    await service.db.delete(member)
    await service.db.commit()
    return {"success": True, "detail": "Member deleted successfully"}
