from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email.lower().strip()))
        return result.scalar_one_or_none()

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.get_by_email(email)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def create(self, user_in: UserCreate) -> User:
        existing = await self.get_by_email(user_in.email)
        if existing:
            raise ConflictException(f"User with email '{user_in.email}' already exists.")

        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hash_password(user_in.password),
            full_name=user_in.full_name.strip(),
            role=user_in.role,
            phone=user_in.phone,
            is_active=user_in.is_active
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: uuid.UUID, user_in: UserUpdate) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)

        if user_in.email and user_in.email.lower().strip() != user.email:
            existing = await self.get_by_email(user_in.email)
            if existing:
                raise ConflictException("Email already in use by another user.")
            user.email = user_in.email.lower().strip()

        if user_in.full_name is not None:
            user.full_name = user_in.full_name.strip()
        if user_in.role is not None:
            user.role = user_in.role
        if user_in.phone is not None:
            user.phone = user_in.phone
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
        if user_in.password:
            user.hashed_password = hash_password(user_in.password)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> tuple[List[User], int]:
        query = select(User)
        count_query = select(func.count(User.id))

        if search:
            search_filter = or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = await self.db.scalar(count_query) or 0
        result = await self.db.execute(query.order_by(User.created_at.desc()).offset(skip).limit(limit))
        return list(result.scalars().all()), total
