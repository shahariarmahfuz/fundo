import uuid
from typing import Optional
from sqlalchemy import String, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Beneficiary(Base, TimestampMixin):
    __tablename__ = "beneficiaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="general", index=True)  # orphan, widow, disability, student, emergency, general
    national_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)  # active, graduated, inactive
    assistance_type: Mapped[str] = mapped_column(String(100), default="financial")  # financial, educational, healthcare, food, shelter
    total_aid_received: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
