import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class LoanBase(BaseModel):
    member_id: uuid.UUID
    fund_id: uuid.UUID
    principal_amount: float
    interest_rate: float = 0.0
    term_months: int = 12
    purpose: Optional[str] = None
    disbursement_date: Optional[date] = None


class LoanCreate(LoanBase):
    pass


class LoanResponse(LoanBase):
    id: uuid.UUID
    loan_number: str
    monthly_installment: float
    total_repayable: float
    total_repaid: float
    outstanding_balance: float
    status: str
    due_date: Optional[date] = None
    member_name: Optional[str] = None
    member_number: Optional[str] = None
    fund_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoanRepaymentCreate(BaseModel):
    loan_id: uuid.UUID
    amount: float
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    repayment_date: date = date.today()
    notes: Optional[str] = None


class LoanRepaymentResponse(LoanRepaymentCreate):
    id: uuid.UUID
    receipt_number: str
    created_at: datetime

    class Config:
        from_attributes = True
