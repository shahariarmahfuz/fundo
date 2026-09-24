import uuid
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    meeting_frequency: Mapped[str] = mapped_column(String(50), default="monthly")
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)

    # Relationships
    members = relationship("Member", back_populates="group", cascade="all, delete-orphan", lazy="selectin")
    contributions = relationship("Contribution", back_populates="group", lazy="select")

