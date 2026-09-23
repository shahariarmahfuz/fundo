import uuid
from typing import Optional
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base, TimestampMixin


class UserRole:
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    STAFF = "staff"
    VIEWER = "viewer"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.STAFF, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
