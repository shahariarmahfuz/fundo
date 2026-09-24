import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Date, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    group_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    join_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    membership_status: Mapped[str] = mapped_column(String(50), default="active", index=True)

    # Optional Personal Information
    father_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mother_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="other")
    national_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    education: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    blood_group: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    marital_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    alt_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    present_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    permanent_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Optional Emergency Contact
    emergency_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_relation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    emergency_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Optional Reference
    reference_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reference_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_relation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Optional Commitment
    commitment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional Documents & Cloudinary Media References
    photo_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    signature_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    document_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nid_front_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    nid_back_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Optional Additional Information
    reason_for_joining: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    group = relationship("Group", back_populates="members", lazy="joined")
    contributions = relationship("Contribution", back_populates="member", lazy="select")
    loans = relationship("Loan", back_populates="member", lazy="select")

    def __repr__(self) -> str:
        return f"<Member {self.member_number} - {self.full_name}>"
