import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "staff"
    phone: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
