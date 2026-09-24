import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload, joinedload

from app.modules.member_applications.models import MemberApplication
from app.modules.member_applications.schemas import (
    PublicMemberApplicationCreate,
    MemberApplicationApproveRequest,
    MemberApplicationRejectRequest
)
from app.modules.members.models import Member
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException


class MemberApplicationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_reference(self) -> str:
        current_year = datetime.now(timezone.utc).year
        # Count applications in this year
        count_query = select(func.count(MemberApplication.id)).where(
            func.extract('year', MemberApplication.submitted_at) == current_year
        )
        count = await self.db.scalar(count_query) or 0
        seq = count + 1
        ref = f"FA-{current_year}-{seq:06d}"
        
        # Ensure uniqueness in case of race
        while True:
            chk = await self.db.execute(
                select(MemberApplication.id).where(MemberApplication.application_reference == ref)
            )
            if not chk.scalar_one_or_none():
                break
            seq += 1
            ref = f"FA-{current_year}-{seq:06d}"
        return ref

    async def generate_member_number(self) -> str:
        count_query = select(func.count(Member.id))
        total_members = await self.db.scalar(count_query) or 0
        seq = total_members + 1001
        num = f"MBR-{seq}"
        
        while True:
            chk = await self.db.execute(select(Member.id).where(Member.member_number == num))
            if not chk.scalar_one_or_none():
                break
            seq += 1
            num = f"MBR-{seq}"
        return num

    async def create_public_application(
        self,
        app_in: PublicMemberApplicationCreate
    ) -> MemberApplication:
        phone_clean = app_in.phone.strip()
        email_clean = app_in.email.lower().strip() if app_in.email else None

        # 1. Duplicate check against active Member records
        phone_member_stmt = select(Member).where(Member.phone == phone_clean)
        res = await self.db.execute(phone_member_stmt)
        if res.scalar_one_or_none():
            raise BadRequestException(
                "A registered Foundation member with this phone number already exists."
            )

        if email_clean:
            email_member_stmt = select(Member).where(func.lower(Member.email) == email_clean)
            res = await self.db.execute(email_member_stmt)
            if res.scalar_one_or_none():
                raise BadRequestException(
                    "A registered Foundation member with this email address already exists."
                )

        # 2. Duplicate check against pending / under-review applications
        pending_phone_stmt = select(MemberApplication).where(
            MemberApplication.phone == phone_clean,
            MemberApplication.status.in_(["pending", "under_review"])
        )
        res = await self.db.execute(pending_phone_stmt)
        existing_app = res.scalar_one_or_none()
        if existing_app:
            raise BadRequestException(
                f"An application with this phone number is already pending review (Reference: {existing_app.application_reference}). Please contact the Foundation if you need assistance."
            )

        if email_clean:
            pending_email_stmt = select(MemberApplication).where(
                func.lower(MemberApplication.email) == email_clean,
                MemberApplication.status.in_(["pending", "under_review"])
            )
            res = await self.db.execute(pending_email_stmt)
            existing_email_app = res.scalar_one_or_none()
            if existing_email_app:
                raise BadRequestException(
                    f"An application with this email address is already pending review (Reference: {existing_email_app.application_reference})."
                )

        # 3. Generate unique application reference
        ref = await self.generate_reference()

        # 4. Construct and save application entity
        application = MemberApplication(
            application_reference=ref,
            full_name=app_in.full_name.strip(),
            date_of_birth=app_in.date_of_birth,
            gender=app_in.gender,
            phone=phone_clean,
            email=email_clean,
            address=app_in.address.strip() if app_in.address else None,
            area=app_in.area.strip() if app_in.area else None,
            occupation=app_in.occupation.strip() if app_in.occupation else None,
            emergency_contact=app_in.emergency_contact.strip() if app_in.emergency_contact else None,
            reason_for_joining=app_in.reason_for_joining.strip() if app_in.reason_for_joining else None,
            additional_info=app_in.additional_info.strip() if app_in.additional_info else None,
            status="pending",
            submitted_at=datetime.now(timezone.utc)
        )

        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def list_applications(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        sort_order: str = "desc"
    ) -> Tuple[List[MemberApplication], int]:
        query = select(MemberApplication).options(
            joinedload(MemberApplication.reviewed_by),
            joinedload(MemberApplication.member)
        )
        count_query = select(func.count(MemberApplication.id))

        if search:
            search_clean = f"%{search.strip()}%"
            filt = or_(
                MemberApplication.full_name.ilike(search_clean),
                MemberApplication.phone.ilike(search_clean),
                MemberApplication.email.ilike(search_clean),
                MemberApplication.application_reference.ilike(search_clean),
                MemberApplication.area.ilike(search_clean)
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        if status and status != "all":
            query = query.where(MemberApplication.status == status)
            count_query = count_query.where(MemberApplication.status == status)

        if from_date:
            query = query.where(func.date(MemberApplication.submitted_at) >= from_date)
            count_query = count_query.where(func.date(MemberApplication.submitted_at) >= from_date)

        if to_date:
            query = query.where(func.date(MemberApplication.submitted_at) <= to_date)
            count_query = count_query.where(func.date(MemberApplication.submitted_at) <= to_date)

        total = await self.db.scalar(count_query) or 0

        order_col = MemberApplication.submitted_at
        query = query.order_by(desc(order_col) if sort_order == "desc" else asc(order_col))
        query = query.offset(skip).limit(limit)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def get_by_id(self, app_id: uuid.UUID) -> Optional[MemberApplication]:
        stmt = (
            select(MemberApplication)
            .options(
                joinedload(MemberApplication.reviewed_by),
                joinedload(MemberApplication.member)
            )
            .where(MemberApplication.id == app_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def approve_application(
        self,
        app_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        req: MemberApplicationApproveRequest
    ) -> MemberApplication:
        # Atomic workflow transaction
        application = await self.get_by_id(app_id)
        if not application:
            raise NotFoundException("MemberApplication", app_id)

        if application.status == "approved":
            raise BadRequestException("This application has already been approved.")

        if application.status not in ["pending", "under_review"]:
            raise BadRequestException(
                f"Application in '{application.status}' state cannot be approved."
            )

        # Check for phone collision with existing member
        phone_chk = await self.db.execute(
            select(Member).where(Member.phone == application.phone)
        )
        if phone_chk.scalar_one_or_none():
            raise ConflictException(
                "A member with this phone number already exists in the Foundation registry."
            )

        # Create new Foundation Member
        member_num = await self.generate_member_number()
        full_address = application.address or ""
        if application.area:
            full_address = f"{full_address}, {application.area}".strip(", ")

        member = Member(
            member_number=member_num,
            full_name=application.full_name,
            phone=application.phone,
            email=application.email,
            gender=application.gender,
            date_of_birth=application.date_of_birth,
            address=full_address if full_address else None,
            group_id=req.group_id,
            membership_status="active",
            join_date=date.today()
        )
        self.db.add(member)
        await self.db.flush()

        # Update application state
        application.status = "approved"
        application.member_id = member.id
        application.reviewed_by_id = reviewer_id
        application.reviewed_at = datetime.now(timezone.utc)
        if req.review_notes:
            application.review_notes = req.review_notes.strip()

        await self.db.commit()
        await self.db.refresh(application)
        return await self.get_by_id(application.id)

    async def reject_application(
        self,
        app_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        req: MemberApplicationRejectRequest
    ) -> MemberApplication:
        application = await self.get_by_id(app_id)
        if not application:
            raise NotFoundException("MemberApplication", app_id)

        if application.status == "approved":
            raise BadRequestException("An approved application cannot be marked as rejected.")

        application.status = "rejected"
        application.rejection_reason = req.rejection_reason.strip()
        application.reviewed_by_id = reviewer_id
        application.reviewed_at = datetime.now(timezone.utc)
        if req.review_notes:
            application.review_notes = req.review_notes.strip()

        await self.db.commit()
        await self.db.refresh(application)
        return await self.get_by_id(application.id)

    async def delete_application(self, app_id: uuid.UUID) -> None:
        application = await self.get_by_id(app_id)
        if not application:
            raise NotFoundException("MemberApplication", app_id)

        await self.db.delete(application)
        await self.db.commit()
