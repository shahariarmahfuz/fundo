import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class PublicMemberApplicationCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="Full legal name of the applicant")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: str = Field("other", max_length=20)
    phone: str = Field(..., min_length=6, max_length=50, description="Active phone number for verification")
    email: Optional[EmailStr] = Field(None, description="Contact email address")
    address: Optional[str] = Field(None, max_length=500, description="Residential address")
    area: Optional[str] = Field(None, max_length=100, description="City, locality, or district")
    occupation: Optional[str] = Field(None, max_length=100, description="Current occupation or profession")
    emergency_contact: Optional[str] = Field(None, max_length=100, description="Emergency contact person and phone")
    reason_for_joining: Optional[str] = Field(None, max_length=1000, description="Reason for seeking foundation membership")
    additional_info: Optional[str] = Field(None, max_length=1000, description="Any supplemental information")
    consent: bool = Field(..., description="Consent to verification and community bylaws agreement")

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must agree to the declaration and consent terms to submit an application.")
        return v

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2:
            raise ValueError("Full name must have at least 2 characters.")
        return clean

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 6:
            raise ValueError("Phone number must have at least 6 digits.")
        return clean


class PublicMemberApplicationResponse(BaseModel):
    success: bool = True
    message: str = "Your membership application has been submitted successfully."
    application_reference: str
    submitted_at: datetime


class MemberApplicationListResponse(BaseModel):
    id: uuid.UUID
    application_reference: str
    full_name: str
    phone: str
    email: Optional[str] = None
    area: Optional[str] = None
    occupation: Optional[str] = None
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_name: Optional[str] = None

    class Config:
        from_attributes = True


class MemberApplicationDetailResponse(BaseModel):
    id: uuid.UUID
    application_reference: str
    full_name: str
    date_of_birth: Optional[date] = None
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    occupation: Optional[str] = None
    emergency_contact: Optional[str] = None
    reason_for_joining: Optional[str] = None
    additional_info: Optional[str] = None
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[uuid.UUID] = None
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    member_id: Optional[uuid.UUID] = None
    member_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberApplicationApproveRequest(BaseModel):
    group_id: Optional[uuid.UUID] = Field(None, description="Optional savings circle or cluster group")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Internal review and orientation notes")


class MemberApplicationRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory reason for application rejection")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Additional internal review notes")
