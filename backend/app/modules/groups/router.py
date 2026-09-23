import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.groups.schemas import GroupCreate, GroupUpdate, GroupResponse
from app.modules.groups.service import GroupService
from app.modules.users.router import require_permission
from app.modules.users.models import User
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.get("", response_model=PaginatedResponse[GroupResponse])
async def list_groups(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("groups.view")),
    db: AsyncSession = Depends(get_db)
):
    service = GroupService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_groups(skip=skip, limit=page_size, search=search)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    resp_items = []
    for g in items:
        resp = GroupResponse(
            id=g.id,
            code=g.code,
            name=g.name,
            description=g.description,
            region=g.region,
            meeting_frequency=g.meeting_frequency,
            status=g.status,
            member_count=len(g.members) if g.members else 0,
            created_at=g.created_at,
            updated_at=g.updated_at
        )
        resp_items.append(resp)

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(require_permission("groups.create")),
    db: AsyncSession = Depends(get_db)
):
    service = GroupService(db)
    group = await service.create(group_in)
    return GroupResponse(
        id=group.id,
        code=group.code,
        name=group.name,
        description=group.description,
        region=group.region,
        meeting_frequency=group.meeting_frequency,
        status=group.status,
        member_count=0,
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: uuid.UUID,
    current_user: User = Depends(require_permission("groups.view")),
    db: AsyncSession = Depends(get_db)
):
    service = GroupService(db)
    group = await service.get_by_id(group_id)
    if not group:
        raise NotFoundException("Group", group_id)
    return GroupResponse(
        id=group.id,
        code=group.code,
        name=group.name,
        description=group.description,
        region=group.region,
        meeting_frequency=group.meeting_frequency,
        status=group.status,
        member_count=len(group.members) if group.members else 0,
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: uuid.UUID,
    group_in: GroupUpdate,
    current_user: User = Depends(require_permission("groups.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = GroupService(db)
    group = await service.update(group_id, group_in)
    return GroupResponse(
        id=group.id,
        code=group.code,
        name=group.name,
        description=group.description,
        region=group.region,
        meeting_frequency=group.meeting_frequency,
        status=group.status,
        member_count=len(group.members) if group.members else 0,
        created_at=group.created_at,
        updated_at=group.updated_at
    )


@router.delete("/{group_id}")
async def delete_group(
    group_id: uuid.UUID,
    current_user: User = Depends(require_permission("groups.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = GroupService(db)
    group = await service.get_by_id(group_id)
    if not group:
        raise NotFoundException("Group", group_id)
    await service.db.delete(group)
    await service.db.commit()
    return {"success": True, "detail": "Group deleted successfully"}
