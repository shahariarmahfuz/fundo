import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# Fund Schemas
class FundBase(BaseModel):
    code: str
    name: str
    fund_type: str = "general"
    currency: str = "USD"
    description: Optional[str] = None
    is_active: bool = True


class FundCreate(FundBase):
    initial_balance: float = 0.0


class FundUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    fund_type: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FundResponse(FundBase):
    id: uuid.UUID
    current_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Donation (Sadaqa) Schemas
class DonationBase(BaseModel):
    donor_name: str
    donor_email: Optional[EmailStr] = None
    donor_phone: Optional[str] = None
    is_anonymous: bool = False
    amount: float
    donation_category: str = "sadaqa"
    fund_id: uuid.UUID
    payment_method: str = "bank_transfer"
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    donation_date: date = date.today()


class DonationCreate(DonationBase):
    pass


class DonationResponse(DonationBase):
    id: uuid.UUID
    receipt_number: str
    status: str
    fund_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Financial Transaction Schemas
class FinancialTransactionResponse(BaseModel):
    id: uuid.UUID
    transaction_number: str
    fund_id: uuid.UUID
    fund_name: Optional[str] = None
    transaction_type: str
    category: str
    amount: float
    balance_after: float
    source_module: str
    source_reference: Optional[str] = None
    description: str
    created_by: Optional[str] = None
    transaction_date: date
    created_at: datetime

    class Config:
        from_attributes = True


# Ledger Entry Schemas
class LedgerEntryCreate(BaseModel):
    entry_number: str
    account_code: str
    account_name: str
    account_type: str
    debit: float = 0.0
    credit: float = 0.0
    description: str
    reference: Optional[str] = None
    entry_date: date = date.today()


class LedgerEntryResponse(LedgerEntryCreate):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
