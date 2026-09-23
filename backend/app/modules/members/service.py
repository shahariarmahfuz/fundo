from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload

from app.modules.members.models import Member
from app.modules.members.schemas import MemberCreate, MemberUpdate
from app.core.exceptions import NotFoundException, ConflictException


class MemberService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, member_id: uuid.UUID) -> Optional[Member]:
        result = await self.db.execute(
            select(Member)
            .options(joinedload(Member.group))
            .where(Member.id == member_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, member_number: str) -> Optional[Member]:
        result = await self.db.execute(
            select(Member).where(Member.member_number == member_number.upper().strip())
        )
        return result.scalar_one_or_none()

    async def list_members(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        group_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None
    ) -> tuple[List[Member], int]:
        query = select(Member).options(joinedload(Member.group))
        count_query = select(func.count(Member.id))

        if search:
            filt = or_(
                Member.full_name.ilike(f"%{search}%"),
                Member.member_number.ilike(f"%{search}%"),
                Member.phone.ilike(f"%{search}%"),
                Member.national_id.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        if group_id:
            query = query.where(Member.group_id == group_id)
            count_query = count_query.where(Member.group_id == group_id)

        if status:
            query = query.where(Member.membership_status == status)
            count_query = count_query.where(Member.membership_status == status)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(Member.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, member_in: MemberCreate) -> Member:
        existing = await self.get_by_number(member_in.member_number)
        if existing:
            raise ConflictException(f"Member number '{member_in.member_number}' already exists.")

        member = Member(
            member_number=member_in.member_number.upper().strip(),
            full_name=member_in.full_name.strip(),
            national_id=member_in.national_id.strip() if member_in.national_id else None,
            phone=member_in.phone.strip(),
            email=member_in.email.lower().strip() if member_in.email else None,
            gender=member_in.gender,
            date_of_birth=member_in.date_of_birth,
            address=member_in.address,
            group_id=member_in.group_id,
            membership_status=member_in.membership_status,
            join_date=member_in.join_date
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return await self.get_by_id(member.id)

    async def update(self, member_id: uuid.UUID, member_in: MemberUpdate) -> Member:
        member = await self.get_by_id(member_id)
        if not member:
            raise NotFoundException("Member", member_id)

        if member_in.member_number and member_in.member_number.upper().strip() != member.member_number:
            existing = await self.get_by_number(member_in.member_number)
            if existing:
                raise ConflictException(f"Member number '{member_in.member_number}' already exists.")
            member.member_number = member_in.member_number.upper().strip()

        if member_in.full_name is not None:
            member.full_name = member_in.full_name.strip()
        if member_in.national_id is not None:
            member.national_id = member_in.national_id.strip() if member_in.national_id else None
        if member_in.phone is not None:
            member.phone = member_in.phone.strip()
        if member_in.email is not None:
            member.email = member_in.email.lower().strip() if member_in.email else None
        if member_in.gender is not None:
            member.gender = member_in.gender
        if member_in.date_of_birth is not None:
            member.date_of_birth = member_in.date_of_birth
        if member_in.address is not None:
            member.address = member_in.address
        if member_in.group_id is not None:
            member.group_id = member_in.group_id
        if member_in.membership_status is not None:
            member.membership_status = member_in.membership_status
        if member_in.join_date is not None:
            member.join_date = member_in.join_date

        await self.db.commit()
        await self.db.refresh(member)
        return await self.get_by_id(member.id)
