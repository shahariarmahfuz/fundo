import uuid
from datetime import date, datetime
from typing import Optional, Union, Any
from pydantic import BaseModel, EmailStr, Field, field_validator


class MemberBase(BaseModel):
    # Required business fields
    full_name: str = Field(..., min_length=1, max_length=255)
    group_id: uuid.UUID
    join_date: date

    # Optional Member ID (member_number)
    member_number: Optional[str] = None
    member_id: Optional[str] = None

    # Optional Personal Info
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = "other"
    national_id: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    address: Optional[str] = None

    # Optional Emergency Contact
    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None

    # Optional Reference
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    reference_relation: Optional[str] = None

    # Optional Commitment & Documents
    commitment: Optional[Union[str, bool]] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None

    # Optional Additional Info
    reason_for_joining: Optional[str] = None
    notes: Optional[str] = None
    membership_status: str = "active"

    @field_validator("commitment", mode="before")
    @classmethod
    def validate_commitment(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, bool):
            return "Agreed" if v else "Declined"
        return str(v).strip() or None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Full Name cannot be empty or whitespace only.")
        return trimmed

    @field_validator("email", mode="before")
    @classmethod
    def clean_empty_email(cls, v):
        if not v or (isinstance(v, str) and not v.strip()):
            return None
        return v.strip().lower()


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    group_id: Optional[uuid.UUID] = None
    join_date: Optional[date] = None
    member_number: Optional[str] = None
    member_id: Optional[str] = None

    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    national_id: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    address: Optional[str] = None

    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None

    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    reference_relation: Optional[str] = None

    commitment: Optional[str] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None

    reason_for_joining: Optional[str] = None
    notes: Optional[str] = None
    membership_status: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Full Name cannot be empty or whitespace only.")
            return trimmed
        return v

    @field_validator("email", mode="before")
    @classmethod
    def clean_empty_email(cls, v):
        if not v or (isinstance(v, str) and not v.strip()):
            return None
        return v.strip().lower()


class MemberResponse(BaseModel):
    id: uuid.UUID
    member_number: str
    full_name: str
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None
    join_date: date
    membership_status: str

    # Optional fields
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    national_id: Optional[str] = None
    occupation: Optional[str] = None
    education: Optional[str] = None
    blood_group: Optional[str] = None
    marital_status: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[str] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    address: Optional[str] = None

    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None

    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    reference_relation: Optional[str] = None

    commitment: Optional[str] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None
    document_type: Optional[str] = None
    nid_front_url: Optional[str] = None
    nid_back_url: Optional[str] = None

    reason_for_joining: Optional[str] = None
    notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
