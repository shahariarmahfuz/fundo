import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import String, Text, Boolean, Integer, Numeric, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class PublicSection(Base, TimestampMixin):
    __tablename__ = "public_sections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)


class PublicProject(Base, TimestampMixin):
    __tablename__ = "public_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0)
    raised_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    beneficiary_count: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class PublicStory(Base, TimestampMixin):
    __tablename__ = "public_stories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(150), default="Foundation Team")
    category: Mapped[str] = mapped_column(String(100), default="Empowerment")
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PublicNewsPost(Base, TimestampMixin):
    __tablename__ = "public_news_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    post_type: Mapped[str] = mapped_column(String(50), default="news", index=True)  # news, blog, report
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PublicLeadership(Base, TimestampMixin):
    __tablename__ = "public_leadership"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="board")  # board, executive, advisory
    display_order: Mapped[int] = mapped_column(Integer, default=0)


class PublicInquiry(Base, TimestampMixin):
    __tablename__ = "public_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="new", index=True)
