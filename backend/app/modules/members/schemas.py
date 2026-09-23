import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class MemberBase(BaseModel):
    member_number: str
    full_name: str
    national_id: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    gender: str = "other"
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    group_id: Optional[uuid.UUID] = None
    membership_status: str = "active"
    join_date: date = date.today()


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    member_number: Optional[str] = None
    full_name: Optional[str] = None
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    group_id: Optional[uuid.UUID] = None
    membership_status: Optional[str] = None
    join_date: Optional[date] = None


class MemberResponse(MemberBase):
    id: uuid.UUID
    group_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
