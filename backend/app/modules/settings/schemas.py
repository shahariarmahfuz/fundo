import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SettingBase(BaseModel):
    key: str
    value: str
    category: str = "general"
    description: Optional[str] = None
    is_public: bool = False


class SettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SettingResponse(SettingBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
