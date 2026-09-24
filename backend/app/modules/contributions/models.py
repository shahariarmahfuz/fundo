import uuid
from datetime import date
from typing import Optional
from sqlalchemy import String, Numeric, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Contribution(Base, TimestampMixin):
    __tablename__ = "contributions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="RESTRICT"),
        nullable=True,
        index=True
    )
    
    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    contribution_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)  # YYYY-MM
    contribution_type: Mapped[str] = mapped_column(String(50), default="monthly_savings", index=True)  # monthly_savings, welfare, emergency_fund, shares
    payment_method: Mapped[str] = mapped_column(String(50), default="bank_transfer")
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="completed", index=True)
    contribution_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    recorded_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    member = relationship("Member", back_populates="contributions", lazy="joined")
    group = relationship("Group", back_populates="contributions", lazy="joined")
    fund = relationship("Fund", lazy="joined")

