from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.modules.beneficiaries.models import Beneficiary
from app.modules.beneficiaries.schemas import BeneficiaryCreate, BeneficiaryUpdate
from app.core.exceptions import NotFoundException, ConflictException


class BeneficiaryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, b_id: uuid.UUID) -> Optional[Beneficiary]:
        result = await self.db.execute(select(Beneficiary).where(Beneficiary.id == b_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[Beneficiary]:
        result = await self.db.execute(
            select(Beneficiary).where(Beneficiary.beneficiary_code == code.upper().strip())
        )
        return result.scalar_one_or_none()

    async def list_beneficiaries(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None
    ) -> tuple[List[Beneficiary], int]:
        query = select(Beneficiary)
        count_query = select(func.count(Beneficiary.id))

        if search:
            filt = or_(
                Beneficiary.full_name.ilike(f"%{search}%"),
                Beneficiary.beneficiary_code.ilike(f"%{search}%"),
                Beneficiary.phone.ilike(f"%{search}%"),
                Beneficiary.location.ilike(f"%{search}%")
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        if category:
            query = query.where(Beneficiary.category == category)
            count_query = count_query.where(Beneficiary.category == category)

        if status:
            query = query.where(Beneficiary.status == status)
            count_query = count_query.where(Beneficiary.status == status)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(
            query.order_by(Beneficiary.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, b_in: BeneficiaryCreate) -> Beneficiary:
        existing = await self.get_by_code(b_in.beneficiary_code)
        if existing:
            raise ConflictException(f"Beneficiary code '{b_in.beneficiary_code}' already exists.")

        beneficiary = Beneficiary(
            beneficiary_code=b_in.beneficiary_code.upper().strip(),
            full_name=b_in.full_name.strip(),
            category=b_in.category,
            national_id=b_in.national_id.strip() if b_in.national_id else None,
            phone=b_in.phone.strip() if b_in.phone else None,
            location=b_in.location.strip() if b_in.location else None,
            status=b_in.status,
            assistance_type=b_in.assistance_type,
            notes=b_in.notes
        )
        self.db.add(beneficiary)
        await self.db.commit()
        await self.db.refresh(beneficiary)
        return beneficiary

    async def update(self, b_id: uuid.UUID, b_in: BeneficiaryUpdate) -> Beneficiary:
        b = await self.get_by_id(b_id)
        if not b:
            raise NotFoundException("Beneficiary", b_id)

        if b_in.beneficiary_code and b_in.beneficiary_code.upper().strip() != b.beneficiary_code:
            existing = await self.get_by_code(b_in.beneficiary_code)
            if existing:
                raise ConflictException(f"Beneficiary code '{b_in.beneficiary_code}' already exists.")
            b.beneficiary_code = b_in.beneficiary_code.upper().strip()

        if b_in.full_name is not None:
            b.full_name = b_in.full_name.strip()
        if b_in.category is not None:
            b.category = b_in.category
        if b_in.national_id is not None:
            b.national_id = b_in.national_id.strip() if b_in.national_id else None
        if b_in.phone is not None:
            b.phone = b_in.phone.strip() if b_in.phone else None
        if b_in.location is not None:
            b.location = b_in.location.strip() if b_in.location else None
        if b_in.status is not None:
            b.status = b_in.status
        if b_in.assistance_type is not None:
            b.assistance_type = b_in.assistance_type
        if b_in.notes is not None:
            b.notes = b_in.notes

        await self.db.commit()
        await self.db.refresh(b)
        return b
