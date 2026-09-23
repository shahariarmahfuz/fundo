import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.public.schemas import (
    PublicSectionResponse,
    PublicSectionUpdate,
    PublicProjectResponse,
    PublicStoryResponse,
    PublicNewsPostResponse,
    PublicLeadershipResponse,
    PublicInquiryCreate,
    PublicInquiryResponse
)
from app.modules.public.service import PublicService
from app.modules.users.router import require_roles
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/public", tags=["Public Platform"])


@router.get("/sections", response_model=Dict[str, Any])
async def get_public_sections(db: AsyncSession = Depends(get_db)):
    service = PublicService(db)
    return await service.get_sections_dict()


@router.put("/sections/{section_key}", response_model=PublicSectionResponse)
async def update_public_section(
    section_key: str,
    update_in: PublicSectionUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    service = PublicService(db)
    return await service.update_section(section_key, update_in)


@router.get("/projects", response_model=List[PublicProjectResponse])
async def get_public_projects(
    status: Optional[str] = Query(None),
    featured_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    service = PublicService(db)
    return await service.list_projects(status=status, featured_only=featured_only)


@router.get("/stories", response_model=List[PublicStoryResponse])
async def get_public_stories(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    service = PublicService(db)
    return await service.list_stories(limit=limit)


@router.get("/news", response_model=List[PublicNewsPostResponse])
async def get_public_news(
    post_type: Optional[str] = Query(None, description="news, blog, report"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    service = PublicService(db)
    return await service.list_news(post_type=post_type, limit=limit)


@router.get("/leadership", response_model=List[PublicLeadershipResponse])
async def get_public_leadership(db: AsyncSession = Depends(get_db)):
    service = PublicService(db)
    return await service.list_leadership()


@router.post("/inquiries", response_model=PublicInquiryResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_inquiry(
    inquiry_in: PublicInquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    service = PublicService(db)
    return await service.create_inquiry(inquiry_in)
