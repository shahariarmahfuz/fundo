import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ContributionBase(BaseModel):
    member_id: uuid.UUID
    fund_id: uuid.UUID
    amount: float
    contribution_type: str = "monthly_savings"
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    contribution_date: date = date.today()


class ContributionCreate(ContributionBase):
    pass


class ContributionResponse(ContributionBase):
    id: uuid.UUID
    receipt_number: str
    status: str
    member_name: Optional[str] = None
    member_number: Optional[str] = None
    fund_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
