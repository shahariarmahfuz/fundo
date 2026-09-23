import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.beneficiaries.schemas import BeneficiaryCreate, BeneficiaryUpdate, BeneficiaryResponse
from app.modules.beneficiaries.service import BeneficiaryService
from app.modules.users.router import require_permission
from app.modules.users.models import User
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])


@router.get("", response_model=PaginatedResponse[BeneficiaryResponse])
async def list_beneficiaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("beneficiaries.view")),
    db: AsyncSession = Depends(get_db)
):
    service = BeneficiaryService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_beneficiaries(
        skip=skip,
        limit=page_size,
        search=search,
        category=category,
        status=status
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[BeneficiaryResponse.model_validate(b) for b in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("", response_model=BeneficiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_beneficiary(
    b_in: BeneficiaryCreate,
    current_user: User = Depends(require_permission("beneficiaries.create")),
    db: AsyncSession = Depends(get_db)
):
    service = BeneficiaryService(db)
    return await service.create(b_in)


@router.get("/{beneficiary_id}", response_model=BeneficiaryResponse)
async def get_beneficiary(
    beneficiary_id: uuid.UUID,
    current_user: User = Depends(require_permission("beneficiaries.view")),
    db: AsyncSession = Depends(get_db)
):
    service = BeneficiaryService(db)
    b = await service.get_by_id(beneficiary_id)
    if not b:
        raise NotFoundException("Beneficiary", beneficiary_id)
    return b


@router.put("/{beneficiary_id}", response_model=BeneficiaryResponse)
async def update_beneficiary(
    beneficiary_id: uuid.UUID,
    b_in: BeneficiaryUpdate,
    current_user: User = Depends(require_permission("beneficiaries.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = BeneficiaryService(db)
    return await service.update(beneficiary_id, b_in)


@router.delete("/{beneficiary_id}")
async def delete_beneficiary(
    beneficiary_id: uuid.UUID,
    current_user: User = Depends(require_permission("beneficiaries.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = BeneficiaryService(db)
    b = await service.get_by_id(beneficiary_id)
    if not b:
        raise NotFoundException("Beneficiary", beneficiary_id)
    await service.db.delete(b)
    await service.db.commit()
    return {"success": True, "detail": "Beneficiary deleted successfully"}
