from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.modules.groups.models import Group
from app.modules.groups.schemas import GroupCreate, GroupUpdate
from app.core.exceptions import NotFoundException, ConflictException


class GroupService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, group_id: uuid.UUID) -> Optional[Group]:
        result = await self.db.execute(select(Group).where(Group.id == group_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Group]:
        result = await self.db.execute(select(Group).where(Group.code == code.upper().strip()))
        return result.scalar_one_or_none()

    async def list_groups(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> tuple[List[Group], int]:
        query = select(Group)
        count_query = select(func.count(Group.id))

        if search:
            filt = or_(
                Group.name.ilike(f"%{search}%"),
                Group.code.ilike(f"%{search}%"),
                Group.region.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(Group.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, group_in: GroupCreate) -> Group:
        existing = await self.get_by_code(group_in.code)
        if existing:
            raise ConflictException(f"Group code '{group_in.code}' already exists.")

        group = Group(
            code=group_in.code.upper().strip(),
            name=group_in.name.strip(),
            description=group_in.description,
            region=group_in.region,
            meeting_frequency=group_in.meeting_frequency,
            status=group_in.status
        )
        self.db.add(group)
        await self.db.commit()
        await self.db.refresh(group)
        return group

    async def update(self, group_id: uuid.UUID, group_in: GroupUpdate) -> Group:
        group = await self.get_by_id(group_id)
        if not group:
            raise NotFoundException("Group", group_id)

        if group_in.code and group_in.code.upper().strip() != group.code:
            existing = await self.get_by_code(group_in.code)
            if existing:
                raise ConflictException(f"Group code '{group_in.code}' already exists.")
            group.code = group_in.code.upper().strip()

        if group_in.name is not None:
            group.name = group_in.name.strip()
        if group_in.description is not None:
            group.description = group_in.description
        if group_in.region is not None:
            group.region = group_in.region
        if group_in.meeting_frequency is not None:
            group.meeting_frequency = group_in.meeting_frequency
        if group_in.status is not None:
            group.status = group_in.status

        await self.db.commit()
        await self.db.refresh(group)
        return group
