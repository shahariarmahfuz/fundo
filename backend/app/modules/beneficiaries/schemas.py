import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BeneficiaryBase(BaseModel):
    beneficiary_code: str
    full_name: str
    category: str = "general"
    national_id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    status: str = "active"
    assistance_type: str = "financial"
    notes: Optional[str] = None


class BeneficiaryCreate(BeneficiaryBase):
    pass


class BeneficiaryUpdate(BaseModel):
    beneficiary_code: Optional[str] = None
    full_name: Optional[str] = None
    category: Optional[str] = None
    national_id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    assistance_type: Optional[str] = None
    notes: Optional[str] = None


class BeneficiaryResponse(BeneficiaryBase):
    id: uuid.UUID
    total_aid_received: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
