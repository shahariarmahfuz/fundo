import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QardHasanahCreate(BaseModel):
    borrower_id: uuid.UUID = Field(..., description="Member borrower UUID")
    group_id: Optional[uuid.UUID] = Field(None, description="Optional savings group UUID")
    fund_id: uuid.UUID = Field(..., description="Capital fund UUID")
    principal_amount: float = Field(..., gt=0, description="Interest-free principal amount")
    disbursement_date: Optional[date] = Field(default_factory=date.today)
    repayment_start_date: Optional[date] = None
    repayment_schedule: str = Field(default="monthly", description="monthly, weekly, bi-weekly, lump_sum")
    installment_amount: Optional[float] = Field(None, gt=0)
    installment_count: int = Field(default=12, ge=1)
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "active"


class QardHasanahUpdate(BaseModel):
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    repayment_schedule: Optional[str] = None
    installment_amount: Optional[float] = Field(None, gt=0)
    installment_count: Optional[int] = Field(None, ge=1)


class QardHasanahResponse(BaseModel):
    id: uuid.UUID
    loan_number: str
    borrower_id: uuid.UUID
    borrower_name: Optional[str] = None
    borrower_number: Optional[str] = None
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None
    group_code: Optional[str] = None
    fund_id: uuid.UUID
    fund_name: Optional[str] = None
    principal_amount: float
    total_repaid: float
    outstanding_principal: float
    disbursement_date: Optional[date] = None
    repayment_start_date: Optional[date] = None
    repayment_schedule: str
    installment_amount: float
    installment_count: int
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QardHasanahRepaymentCreate(BaseModel):
    loan_id: Optional[uuid.UUID] = Field(None, description="Target Qard Hasanah loan UUID")
    amount: float = Field(..., gt=0, description="Repayment amount toward principal")
    payment_date: Optional[date] = Field(default_factory=date.today)
    payment_method: str = Field(default="bank_transfer")
    reference: Optional[str] = None
    notes: Optional[str] = None


class QardHasanahRepaymentResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    loan_id: uuid.UUID
    loan_number: Optional[str] = None
    borrower_name: Optional[str] = None
    borrower_number: Optional[str] = None
    amount: float
    payment_date: date
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QardHasanahReportResponse(BaseModel):
    total_issued_amount: float
    total_principal_outstanding: float
    total_principal_repaid: float
    total_loans_count: int
    active_count: int
    partially_repaid_count: int
    fully_repaid_count: int
    pending_count: int
    cancelled_count: int
    overdue_count: int
    borrower_summary: List[Dict[str, Any]]
    group_summary: List[Dict[str, Any]]
