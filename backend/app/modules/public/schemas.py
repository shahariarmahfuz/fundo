import uuid
from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr


class PublicSectionResponse(BaseModel):
    id: uuid.UUID
    section_key: str
    title: str
    subtitle: Optional[str] = None
    content: str
    metadata_json: Optional[Dict[str, Any]] = None
    is_published: bool
    display_order: int

    class Config:
        from_attributes = True


class PublicSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    is_published: Optional[bool] = None
    display_order: Optional[int] = None


class PublicProjectResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    category: str
    description: str
    target_amount: float
    raised_amount: float
    location: str
    image_url: Optional[str] = None
    status: str
    beneficiary_count: int
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PublicStoryResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    summary: str
    content: str
    author: str
    category: str
    image_url: Optional[str] = None
    is_published: bool
    published_at: datetime

    class Config:
        from_attributes = True


class PublicNewsPostResponse(BaseModel):
    id: uuid.UUID
    slug: str
    post_type: str
    title: str
    excerpt: str
    content: str
    cover_image: Optional[str] = None
    document_url: Optional[str] = None
    is_published: bool
    published_at: datetime

    class Config:
        from_attributes = True


class PublicLeadershipResponse(BaseModel):
    id: uuid.UUID
    name: str
    role_title: str
    bio: str
    avatar_url: Optional[str] = None
    category: str
    display_order: int

    class Config:
        from_attributes = True


class PublicInquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str


class PublicInquiryResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
