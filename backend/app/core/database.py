from typing import AsyncGenerator
from datetime import datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncAttrs
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.config import settings

# Async Engine with optimized connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development" and False),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
    connect_args={
        "server_settings": {
            "application_name": "fundo_foundation_backend",
        },
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(AsyncAttrs, DeclarativeBase):
    pass


class TimestampMixin:
    """Provides created_at and updated_at audit timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async SQLAlchemy session with transaction context."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
