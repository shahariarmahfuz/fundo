import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Date, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    national_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    phone: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gender: Mapped[str] = mapped_column(String(20), default="other")
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    membership_status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    join_date: Mapped[date] = mapped_column(Date, default=date.today)

    # Relationships
    group = relationship("Group", back_populates="members", lazy="joined")
    contributions = relationship("Contribution", back_populates="member", lazy="select")
    loans = relationship("Loan", back_populates="member", lazy="select")
