import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GroupBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    region: Optional[str] = None
    meeting_frequency: str = "monthly"
    status: str = "active"


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None
    meeting_frequency: Optional[str] = None
    status: Optional[str] = None


class GroupResponse(GroupBase):
    id: uuid.UUID
    member_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
