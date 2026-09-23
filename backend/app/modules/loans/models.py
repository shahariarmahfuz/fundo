import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Numeric, Integer, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Loan(Base, TimestampMixin):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    principal_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)  # 0.0 for interest-free/Qard Hasan
    term_months: Mapped[int] = mapped_column(Integer, default=12)
    monthly_installment: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_repayable: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_repaid: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0)
    
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)  # pending, approved, active, completed, defaulted
    disbursement_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    member = relationship("Member", back_populates="loans", lazy="joined")
    fund = relationship("Fund", lazy="joined")
    repayments = relationship("LoanRepayment", back_populates="loan", cascade="all, delete-orphan", lazy="select")


class LoanRepayment(Base, TimestampMixin):
    __tablename__ = "loan_repayments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    loan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="bank_transfer")
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    repayment_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    loan = relationship("Loan", back_populates="repayments", lazy="joined")
