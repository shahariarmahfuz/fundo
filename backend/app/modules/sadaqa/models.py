import uuid
from datetime import date
from typing import Optional
from sqlalchemy import String, Text, Boolean, Numeric, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin
from app.modules.finance.models import Fund
from app.modules.members.models import Member
from app.modules.beneficiaries.models import Beneficiary


class SadaqaDonation(Base, TimestampMixin):
    """
    Dedicated Sadaqa (Charitable Giving & Donations) Model.
    Permanent voluntary donation — strictly zero repayment, zero debt, zero interest.
    """
    __tablename__ = "sadaqa_donations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    # Donor classification
    donor_type: Mapped[str] = mapped_column(String(50), default="other", index=True)  # 'member', 'beneficiary', 'other'
    member_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("members.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    beneficiary_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("beneficiaries.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    donor_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    donor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    donor_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)

    # Financial details
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    fund_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("funds.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    donation_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    
    payment_method: Mapped[str] = mapped_column(String(50), default="bank_transfer")  # bank_transfer, cash, card, mobile_money, cheque
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(255), default="General Sadaqa", nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="completed", index=True)  # completed, cancelled
    created_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    fund = relationship("Fund", lazy="joined")
    member = relationship("Member", lazy="joined")
    beneficiary = relationship("Beneficiary", lazy="joined")

    __table_args__ = (
        Index("ix_sadaqa_donations_fund_date", "fund_id", "donation_date"),
        Index("ix_sadaqa_donations_status_date", "status", "donation_date"),
    )
