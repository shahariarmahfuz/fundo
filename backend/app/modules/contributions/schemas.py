import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ContributionBase(BaseModel):
    member_id: uuid.UUID
    fund_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0, description="Actual payment amount (can be equal, less, or greater than base)")
    contribution_month: Optional[str] = Field(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Target accounting month (YYYY-MM)")
    contribution_type: str = "monthly_savings"
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    contribution_date: Optional[date] = None
    notes: Optional[str] = None


class ContributionCreate(ContributionBase):
    pass


class ContributionResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    member_id: uuid.UUID
    member_name: Optional[str] = None
    member_number: Optional[str] = None
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None
    group_code: Optional[str] = None
    fund_id: uuid.UUID
    fund_name: Optional[str] = None
    amount: float
    contribution_month: str
    contribution_type: str
    payment_method: str
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    status: str
    contribution_date: date
    recorded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberDuePreviewResponse(BaseModel):
    member_id: uuid.UUID
    member_name: str
    member_number: str
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None
    contribution_month: str
    base_contribution: float
    already_paid: float
    outstanding_due: float


class MemberMonthlyLedgerItem(BaseModel):
    month: str  # YYYY-MM
    expected_amount: float
    paid_amount: float
    due_amount: float
    status: str  # "paid", "partial", "unpaid", "surplus"
    payments: List[ContributionResponse] = []


class MemberContributionLedgerResponse(BaseModel):
    member_id: uuid.UUID
    member_name: str
    member_number: str
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None
    join_date: date
    total_expected: float
    total_paid: float
    total_due: float
    monthly_records: List[MemberMonthlyLedgerItem]
    transactions: List[ContributionResponse]


class GroupMemberFundStatus(BaseModel):
    member_id: uuid.UUID
    member_name: str
    member_number: str
    membership_status: str
    current_month_expected: float
    current_month_paid: float
    current_month_due: float
    lifetime_contributed: float


class GroupFundResponse(BaseModel):
    group_id: uuid.UUID
    group_name: str
    group_code: str
    region: Optional[str] = None
    meeting_frequency: str = "monthly"
    status: str
    total_members: int
    current_month: str
    current_month_contributions: float
    total_contributions: float
    outstanding_member_due: float
    members: List[GroupMemberFundStatus] = []


class BaseContributionRateResponse(BaseModel):
    id: uuid.UUID
    amount: float
    effective_from: date
    effective_to: Optional[date] = None
    description: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BaseContributionRateUpdate(BaseModel):
    amount: float = Field(..., gt=0, description="New base monthly contribution amount")
    effective_from: Optional[date] = Field(None, description="Date from which the new rate applies (e.g. 2026-10-01)")
    description: Optional[str] = Field(None, description="Reason or notes for rate change")
