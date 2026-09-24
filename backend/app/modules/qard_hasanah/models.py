import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Numeric, Integer, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class QardHasanahLoan(Base, TimestampMixin):
    __tablename__ = "qard_hasanah_loans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    borrower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    principal_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_repaid: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)

    disbursement_date: Mapped[Optional[date]] = mapped_column(Date, default=date.today, nullable=True)
    repayment_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    repayment_schedule: Mapped[str] = mapped_column(String(50), default="monthly")  # monthly, weekly, bi-weekly, lump_sum

    installment_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    installment_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)  # pending, active, partially_repaid, fully_repaid, cancelled
    created_by: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Relationships
    borrower = relationship("Member", lazy="joined")
    group = relationship("Group", lazy="joined")
    fund = relationship("Fund", lazy="joined")
    repayments = relationship("QardHasanahRepayment", back_populates="loan", cascade="all, delete-orphan", lazy="select")


class QardHasanahRepayment(Base, TimestampMixin):
    __tablename__ = "qard_hasanah_repayments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    loan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("qard_hasanah_loans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    payment_method: Mapped[str] = mapped_column(String(50), default="bank_transfer")
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Relationships
    loan = relationship("QardHasanahLoan", back_populates="repayments", lazy="joined")
