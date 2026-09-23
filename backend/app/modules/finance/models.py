import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Numeric, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Fund(Base, TimestampMixin):
    __tablename__ = "funds"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    fund_type: Mapped[str] = mapped_column(String(50), default="general", index=True)  # general, restricted, endowment, loan_pool, sadaqa_zakat
    current_balance: Mapped[float] = mapped_column(Numeric(16, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Relationships
    donations = relationship("Donation", back_populates="fund", lazy="select")
    transactions = relationship("FinancialTransaction", back_populates="fund", lazy="select")


class Donation(Base, TimestampMixin):
    """Sadaqa, Zakat, and general charitable donations."""
    __tablename__ = "donations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    donor_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    donor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    donor_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    donation_category: Mapped[str] = mapped_column(String(50), default="sadaqa", index=True)  # sadaqa, zakat, general, waqf, emergency
    
    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    payment_method: Mapped[str] = mapped_column(String(50), default="bank_transfer")  # bank_transfer, card, cash, mobile_money
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="completed", index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    donation_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)

    # Relationships
    fund = relationship("Fund", back_populates="donations", lazy="joined")


class FinancialTransaction(Base, TimestampMixin):
    """Immutable audit trail of all cash and fund movements."""
    __tablename__ = "financial_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # credit, debit
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # donation, contribution, loan_disbursement, loan_repayment, aid_grant, expense
    amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    balance_after: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    
    source_module: Mapped[str] = mapped_column(String(50), nullable=False)  # finance, contributions, loans, beneficiaries
    source_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)

    # Relationships
    fund = relationship("Fund", back_populates="transactions", lazy="joined")


class LedgerEntry(Base, TimestampMixin):
    """Double-entry bookkeeping journal entries."""
    __tablename__ = "ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    account_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # asset, liability, equity, revenue, expense
    
    debit: Mapped[float] = mapped_column(Numeric(16, 2), default=0.0)
    credit: Mapped[float] = mapped_column(Numeric(16, 2), default=0.0)
    
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    entry_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
