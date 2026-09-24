import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class SadaqaCreate(BaseModel):
    donor_type: str = Field(default="other", description="Donor category: 'member', 'beneficiary', or 'other'")
    member_id: Optional[uuid.UUID] = None
    beneficiary_id: Optional[uuid.UUID] = None
    donor_name: Optional[str] = Field(None, description="Name of the donor (auto-populated if member or beneficiary)")
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    is_anonymous: bool = False
    amount: float = Field(..., gt=0, description="Permanent donation amount in currency units")
    fund_id: uuid.UUID
    donation_date: Optional[date] = None
    payment_method: str = Field(default="bank_transfer", description="bank_transfer, cash, card, mobile_money, cheque")
    reference: Optional[str] = None
    purpose: Optional[str] = "General Sadaqa"
    notes: Optional[str] = None


class SadaqaUpdate(BaseModel):
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    purpose: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class SadaqaResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    donor_type: str
    member_id: Optional[uuid.UUID] = None
    member_name: Optional[str] = None
    member_number: Optional[str] = None
    beneficiary_id: Optional[uuid.UUID] = None
    beneficiary_name: Optional[str] = None
    beneficiary_number: Optional[str] = None
    donor_name: str
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    is_anonymous: bool
    amount: float
    fund_id: uuid.UUID
    fund_name: Optional[str] = None
    fund_code: Optional[str] = None
    donation_date: date
    payment_method: str
    reference: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FundBreakdown(BaseModel):
    fund_id: uuid.UUID
    fund_name: str
    fund_code: str
    count: int
    total_amount: float
    percentage: float


class MonthlyBreakdown(BaseModel):
    month: str  # YYYY-MM
    count: int
    total_amount: float


class DonorTypeBreakdown(BaseModel):
    donor_type: str
    count: int
    total_amount: float


class TopDonorItem(BaseModel):
    donor_name: str
    donor_type: str
    count: int
    total_amount: float


class SadaqaReportResponse(BaseModel):
    total_amount_received: float
    total_donations_count: int
    average_donation_amount: float
    this_month_amount: float
    this_year_amount: float
    fund_breakdown: List[FundBreakdown] = []
    monthly_breakdown: List[MonthlyBreakdown] = []
    donor_type_breakdown: List[DonorTypeBreakdown] = []
    top_donors: List[TopDonorItem] = []
