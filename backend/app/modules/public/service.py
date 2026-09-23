from typing import Optional, List, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.modules.public.models import (
    PublicSection,
    PublicProject,
    PublicStory,
    PublicNewsPost,
    PublicLeadership,
    PublicInquiry
)
from app.modules.public.schemas import PublicSectionUpdate, PublicInquiryCreate
from app.core.cache import cache_service
from app.core.exceptions import NotFoundException


class PublicService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_sections_dict(self) -> Dict[str, Any]:
        """Fetch all published sections, leveraging cache for high-throughput public views."""
        cache_key = "public:sections:all"
        cached = await cache_service.get(cache_key)
        if cached is not None:
            return cached

        result = await self.db.execute(
            select(PublicSection)
            .where(PublicSection.is_published == True)
            .order_by(PublicSection.display_order.asc())
        )
        sections = result.scalars().all()
        data = {
            s.section_key: {
                "id": str(s.id),
                "section_key": s.section_key,
                "title": s.title,
                "subtitle": s.subtitle,
                "content": s.content,
                "metadata_json": s.metadata_json,
                "display_order": s.display_order
            }
            for s in sections
        }
        await cache_service.set(cache_key, data, ttl=600)  # 10 min TTL
        return data

    async def update_section(self, section_key: str, update_in: PublicSectionUpdate) -> PublicSection:
        result = await self.db.execute(
            select(PublicSection).where(PublicSection.section_key == section_key)
        )
        section = result.scalar_one_or_none()
        if not section:
            raise NotFoundException("PublicSection", section_key)

        if update_in.title is not None:
            section.title = update_in.title
        if update_in.subtitle is not None:
            section.subtitle = update_in.subtitle
        if update_in.content is not None:
            section.content = update_in.content
        if update_in.metadata_json is not None:
            section.metadata_json = update_in.metadata_json
        if update_in.is_published is not None:
            section.is_published = update_in.is_published
        if update_in.display_order is not None:
            section.display_order = update_in.display_order

        await self.db.commit()
        await self.db.refresh(section)
        # Invalidate cache
        await cache_service.delete("public:sections:all")
        return section

    async def list_projects(self, status: Optional[str] = None, featured_only: bool = False) -> List[PublicProject]:
        query = select(PublicProject)
        if status:
            query = query.where(PublicProject.status == status)
        if featured_only:
            query = query.where(PublicProject.is_featured == True)
        result = await self.db.execute(query.order_by(desc(PublicProject.created_at)))
        return list(result.scalars().all())

    async def get_project_by_slug(self, slug: str) -> Optional[PublicProject]:
        result = await self.db.execute(select(PublicProject).where(PublicProject.slug == slug))
        return result.scalar_one_or_none()

    async def list_stories(self, limit: int = 20) -> List[PublicStory]:
        result = await self.db.execute(
            select(PublicStory)
            .where(PublicStory.is_published == True)
            .order_by(desc(PublicStory.published_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_news(self, post_type: Optional[str] = None, limit: int = 20) -> List[PublicNewsPost]:
        query = select(PublicNewsPost).where(PublicNewsPost.is_published == True)
        if post_type:
            query = query.where(PublicNewsPost.post_type == post_type)
        result = await self.db.execute(query.order_by(desc(PublicNewsPost.published_at)).limit(limit))
        return list(result.scalars().all())

    async def list_leadership(self) -> List[PublicLeadership]:
        result = await self.db.execute(
            select(PublicLeadership).order_by(PublicLeadership.display_order.asc())
        )
        return list(result.scalars().all())

    async def create_inquiry(self, inquiry_in: PublicInquiryCreate) -> PublicInquiry:
        inquiry = PublicInquiry(
            name=inquiry_in.name.strip(),
            email=inquiry_in.email.lower().strip(),
            phone=inquiry_in.phone.strip() if inquiry_in.phone else None,
            subject=inquiry_in.subject.strip(),
            message=inquiry_in.message.strip(),
            status="new"
        )
        self.db.add(inquiry)
        await self.db.commit()
        await self.db.refresh(inquiry)
        return inquiry
