import re
import uuid
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text
from sqlalchemy.orm import joinedload

from app.modules.members.models import Member
from app.modules.groups.models import Group
from app.modules.members.schemas import MemberCreate, MemberUpdate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException

logger = logging.getLogger("fundo.members.service")


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
        if not member_number:
            return None
        result = await self.db.execute(
            select(Member).where(func.upper(Member.member_number) == member_number.upper().strip())
        )
        return result.scalar_one_or_none()

    async def generate_next_member_id(self) -> str:
        """
        Concurrency-safe generation of next Member ID (M-00001, M-00002, ...)
        Uses PostgreSQL sequence `member_id_seq` with collision verification.
        """
        while True:
            seq_val = await self.db.scalar(text("SELECT nextval('member_id_seq')"))
            candidate = f"M-{seq_val:05d}"
            # Verify candidate is not taken by a prior custom manual entry
            existing = await self.get_by_number(candidate)
            if not existing:
                return candidate

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
            search_clean = search.strip()
            filt = or_(
                Member.full_name.ilike(f"%{search_clean}%"),
                Member.member_number.ilike(f"%{search_clean}%"),
                Member.phone.ilike(f"%{search_clean}%"),
                Member.national_id.ilike(f"%{search_clean}%")
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
        """
        Creates a new member with atomic validation and ID generation.
        Only Full Name, Group, and Join Date are required.
        """
        # 1. Validate Group (Required)
        if not member_in.group_id:
            raise BadRequestException("Group selection is required.")

        group_stmt = select(Group).where(Group.id == member_in.group_id)
        group_res = await self.db.execute(group_stmt)
        group = group_res.scalar_one_or_none()
        if not group:
            raise BadRequestException("The selected Group does not exist. Please select a valid Group.")

        # 2. Resolve Member ID (Optional manual or auto-generated)
        raw_id = (member_in.member_id or member_in.member_number or "").strip()
        if raw_id:
            existing = await self.get_by_number(raw_id)
            if existing:
                raise ConflictException(
                    f"Member ID '{raw_id}' is already in use. Please provide a unique Member ID or leave it blank to auto-generate."
                )
            final_member_number = raw_id.upper()
        else:
            final_member_number = await self.generate_next_member_id()

        # 3. Create member record
        member = Member(
            member_number=final_member_number,
            full_name=member_in.full_name.strip(),
            group_id=member_in.group_id,
            join_date=member_in.join_date,
            membership_status=member_in.membership_status or "active",

            # Optional personal info
            father_name=member_in.father_name.strip() if member_in.father_name else None,
            mother_name=member_in.mother_name.strip() if member_in.mother_name else None,
            date_of_birth=member_in.date_of_birth,
            gender=member_in.gender or "other",
            national_id=member_in.national_id.strip() if member_in.national_id else None,
            occupation=member_in.occupation.strip() if member_in.occupation else None,
            education=member_in.education.strip() if member_in.education else None,
            blood_group=member_in.blood_group.strip() if member_in.blood_group else None,
            marital_status=member_in.marital_status.strip() if member_in.marital_status else None,
            phone=member_in.phone.strip() if member_in.phone else None,
            alt_phone=member_in.alt_phone.strip() if member_in.alt_phone else None,
            email=member_in.email.lower().strip() if member_in.email else None,
            present_address=member_in.present_address.strip() if member_in.present_address else None,
            permanent_address=member_in.permanent_address.strip() if member_in.permanent_address else None,
            address=(member_in.present_address or member_in.address or "").strip() or None,

            # Optional emergency contact
            emergency_name=member_in.emergency_name.strip() if member_in.emergency_name else None,
            emergency_relation=member_in.emergency_relation.strip() if member_in.emergency_relation else None,
            emergency_phone=member_in.emergency_phone.strip() if member_in.emergency_phone else None,

            # Optional reference
            reference_name=member_in.reference_name.strip() if member_in.reference_name else None,
            reference_phone=member_in.reference_phone.strip() if member_in.reference_phone else None,
            reference_relation=member_in.reference_relation.strip() if member_in.reference_relation else None,

            # Optional commitment & documents
            commitment=member_in.commitment.strip() if member_in.commitment else None,
            photo_url=member_in.photo_url.strip() if member_in.photo_url else None,
            signature_url=member_in.signature_url.strip() if member_in.signature_url else None,
            document_type=member_in.document_type.strip() if member_in.document_type else None,
            nid_front_url=member_in.nid_front_url.strip() if member_in.nid_front_url else None,
            nid_back_url=member_in.nid_back_url.strip() if member_in.nid_back_url else None,

            # Optional additional info
            reason_for_joining=member_in.reason_for_joining.strip() if member_in.reason_for_joining else None,
            notes=member_in.notes.strip() if member_in.notes else None
        )

        try:
            self.db.add(member)
            await self.db.commit()
            await self.db.refresh(member)
            return await self.get_by_id(member.id)
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to create member: {e}")
            raise

    async def update(self, member_id: uuid.UUID, member_in: MemberUpdate) -> Member:
        member = await self.get_by_id(member_id)
        if not member:
            raise NotFoundException("Member", member_id)

        # Validate group if changed
        if member_in.group_id is not None:
            group_stmt = select(Group).where(Group.id == member_in.group_id)
            group_res = await self.db.execute(group_stmt)
            if not group_res.scalar_one_or_none():
                raise BadRequestException("The selected Group does not exist.")
            member.group_id = member_in.group_id

        # Validate member ID if changed
        new_id = (member_in.member_id or member_in.member_number or "").strip()
        if new_id and new_id.upper() != member.member_number:
            existing = await self.get_by_number(new_id)
            if existing:
                raise ConflictException(f"Member ID '{new_id}' is already in use.")
            member.member_number = new_id.upper()

        if member_in.full_name is not None:
            member.full_name = member_in.full_name.strip()
        if member_in.join_date is not None:
            member.join_date = member_in.join_date
        if member_in.membership_status is not None:
            member.membership_status = member_in.membership_status

        # Optional fields update
        if member_in.father_name is not None:
            member.father_name = member_in.father_name.strip() if member_in.father_name else None
        if member_in.mother_name is not None:
            member.mother_name = member_in.mother_name.strip() if member_in.mother_name else None
        if member_in.date_of_birth is not None:
            member.date_of_birth = member_in.date_of_birth
        if member_in.gender is not None:
            member.gender = member_in.gender
        if member_in.national_id is not None:
            member.national_id = member_in.national_id.strip() if member_in.national_id else None
        if member_in.occupation is not None:
            member.occupation = member_in.occupation.strip() if member_in.occupation else None
        if member_in.education is not None:
            member.education = member_in.education.strip() if member_in.education else None
        if member_in.blood_group is not None:
            member.blood_group = member_in.blood_group.strip() if member_in.blood_group else None
        if member_in.marital_status is not None:
            member.marital_status = member_in.marital_status.strip() if member_in.marital_status else None
        if member_in.phone is not None:
            member.phone = member_in.phone.strip() if member_in.phone else None
        if member_in.alt_phone is not None:
            member.alt_phone = member_in.alt_phone.strip() if member_in.alt_phone else None
        if member_in.email is not None:
            member.email = member_in.email.lower().strip() if member_in.email else None
        if member_in.present_address is not None:
            member.present_address = member_in.present_address.strip() if member_in.present_address else None
            member.address = member.present_address
        if member_in.permanent_address is not None:
            member.permanent_address = member_in.permanent_address.strip() if member_in.permanent_address else None

        if member_in.emergency_name is not None:
            member.emergency_name = member_in.emergency_name.strip() if member_in.emergency_name else None
        if member_in.emergency_relation is not None:
            member.emergency_relation = member_in.emergency_relation.strip() if member_in.emergency_relation else None
        if member_in.emergency_phone is not None:
            member.emergency_phone = member_in.emergency_phone.strip() if member_in.emergency_phone else None

        if member_in.reference_name is not None:
            member.reference_name = member_in.reference_name.strip() if member_in.reference_name else None
        if member_in.reference_phone is not None:
            member.reference_phone = member_in.reference_phone.strip() if member_in.reference_phone else None
        if member_in.reference_relation is not None:
            member.reference_relation = member_in.reference_relation.strip() if member_in.reference_relation else None

        if member_in.commitment is not None:
            member.commitment = member_in.commitment.strip() if member_in.commitment else None
        if member_in.photo_url is not None:
            member.photo_url = member_in.photo_url.strip() if member_in.photo_url else None
        if member_in.signature_url is not None:
            member.signature_url = member_in.signature_url.strip() if member_in.signature_url else None
        if member_in.document_type is not None:
            member.document_type = member_in.document_type.strip() if member_in.document_type else None
        if member_in.nid_front_url is not None:
            member.nid_front_url = member_in.nid_front_url.strip() if member_in.nid_front_url else None
        if member_in.nid_back_url is not None:
            member.nid_back_url = member_in.nid_back_url.strip() if member_in.nid_back_url else None

        if member_in.reason_for_joining is not None:
            member.reason_for_joining = member_in.reason_for_joining.strip() if member_in.reason_for_joining else None
        if member_in.notes is not None:
            member.notes = member_in.notes.strip() if member_in.notes else None

        try:
            await self.db.commit()
            await self.db.refresh(member)
            return await self.get_by_id(member.id)
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to update member {member_id}: {e}")
            raise
