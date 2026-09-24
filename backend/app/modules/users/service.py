from typing import Optional, List, Set
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete
from sqlalchemy.orm import selectinload

from app.modules.users.models import User, Role, Permission, RolePermission, UserRoleAssociation, UserRole
from app.modules.users.schemas import UserCreate, UserUpdate, RoleCreate, RoleUpdate, ProfileUpdate
from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.cache import cache_service
from app.core.rbac_data import SYSTEM_PERMISSIONS


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(
            select(User).options(selectinload(User.roles)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).options(selectinload(User.roles)).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def get_user_permissions(self, user_id: uuid.UUID) -> List[str]:
        cache_key = f"fundo:perms:{user_id}"
        cached = await cache_service.get(cache_key)
        if cached is not None and isinstance(cached, list):
            return cached

        user = await self.get_by_id(user_id)
        if not user:
            return []

        # Super admin check
        if user.is_superadmin:
            all_perms = [p["code"] for p in SYSTEM_PERMISSIONS]
            await cache_service.set(cache_key, all_perms, ttl=300)
            return all_perms

        # Get permissions via UserRoleAssociation -> RolePermission -> Permission
        stmt = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(UserRoleAssociation, UserRoleAssociation.role_id == RolePermission.role_id)
            .where(UserRoleAssociation.user_id == user_id)
            .distinct()
        )
        res = await self.db.execute(stmt)
        perms: Set[str] = set(res.scalars().all())

        # Also fallback: if user.role is set and user has no associations yet
        if user.role:
            role_stmt = (
                select(Permission.code)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .join(Role, Role.id == RolePermission.role_id)
                .where(Role.name == user.role)
                .distinct()
            )
            r_res = await self.db.execute(role_stmt)
            for code in r_res.scalars().all():
                perms.add(code)

        perm_list = sorted(list(perms))
        await cache_service.set(cache_key, perm_list, ttl=300)
        return perm_list

    async def get_user_roles(self, user_id: uuid.UUID) -> List[str]:
        stmt = (
            select(Role.name)
            .join(UserRoleAssociation, UserRoleAssociation.role_id == Role.id)
            .where(UserRoleAssociation.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        roles = list(res.scalars().all())
        user = await self.get_by_id(user_id)
        if user and user.role and user.role not in roles:
            roles.append(user.role)
        return roles

    async def invalidate_user_cache(self, user_id: uuid.UUID):
        await cache_service.delete(f"fundo:perms:{user_id}")

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
        await self.db.flush()

        # Associate role(s)
        if user_in.role_ids:
            for rid in user_in.role_ids:
                self.db.add(UserRoleAssociation(user_id=user.id, role_id=rid))
        else:
            # Map default role by name if exists
            r_stmt = select(Role).where(Role.name == user_in.role)
            r_res = await self.db.execute(r_stmt)
            r = r_res.scalar_one_or_none()
            if r:
                self.db.add(UserRoleAssociation(user_id=user.id, role_id=r.id))

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
        if user_in.avatar_url is not None:
            user.avatar_url = user_in.avatar_url.strip() if user_in.avatar_url else None
        if user_in.avatar_public_id is not None:
            user.avatar_public_id = user_in.avatar_public_id.strip() if user_in.avatar_public_id else None

        if user_in.role_ids is not None:
            await self.db.execute(
                delete(UserRoleAssociation).where(UserRoleAssociation.user_id == user_id)
            )
            for rid in user_in.role_ids:
                self.db.add(UserRoleAssociation(user_id=user_id, role_id=rid))

        await self.db.commit()
        await self.invalidate_user_cache(user_id)
        await self.db.refresh(user)
        return user

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> tuple[List[User], int]:
        query = select(User).options(selectinload(User.roles))
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

    # ================= Role & Permission Management =================
    async def list_permissions(self) -> List[Permission]:
        stmt = select(Permission).order_by(Permission.module.asc(), Permission.action.asc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def list_roles(self) -> List[Role]:
        stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.name.asc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_role(self, role_id: uuid.UUID) -> Optional[Role]:
        stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_role(self, role_in: RoleCreate) -> Role:
        existing = await self.db.execute(select(Role).where(Role.name == role_in.name.strip().lower()))
        if existing.scalar_one_or_none():
            raise ConflictException(f"Role '{role_in.name}' already exists.")

        role = Role(
            name=role_in.name.strip().lower(),
            display_name=role_in.display_name.strip(),
            description=role_in.description,
            is_system=role_in.is_system
        )
        self.db.add(role)
        await self.db.flush()

        if role_in.permission_codes:
            p_stmt = select(Permission).where(Permission.code.in_(role_in.permission_codes))
            p_res = await self.db.execute(p_stmt)
            perms = p_res.scalars().all()
            for p in perms:
                self.db.add(RolePermission(role_id=role.id, permission_id=p.id))

        await self.db.commit()
        return await self.get_role(role.id)

    async def update_role(self, role_id: uuid.UUID, role_in: RoleUpdate) -> Role:
        role = await self.get_role(role_id)
        if not role:
            raise NotFoundException("Role", role_id)

        if role_in.display_name is not None:
            role.display_name = role_in.display_name.strip()
        if role_in.description is not None:
            role.description = role_in.description

        if role_in.permission_codes is not None:
            # Delete existing role permissions
            await self.db.execute(
                delete(RolePermission).where(RolePermission.role_id == role_id)
            )
            p_stmt = select(Permission).where(Permission.code.in_(role_in.permission_codes))
            p_res = await self.db.execute(p_stmt)
            for p in p_res.scalars().all():
                self.db.add(RolePermission(role_id=role_id, permission_id=p.id))

        await self.db.commit()
        # Invalidate all user caches
        await cache_service.clear()
        return await self.get_role(role_id)

    async def delete_role(self, role_id: uuid.UUID):
        role = await self.get_role(role_id)
        if not role:
            raise NotFoundException("Role", role_id)
        if role.is_system:
            raise BadRequestException("Cannot delete system roles.")

        await self.db.execute(delete(Role).where(Role.id == role_id))
        await self.db.commit()
        await cache_service.clear()

    async def update_profile(self, user_id: uuid.UUID, profile_in: ProfileUpdate) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)

        if profile_in.full_name is not None and profile_in.full_name.strip():
            user.full_name = profile_in.full_name.strip()
        if profile_in.phone is not None:
            user.phone = profile_in.phone.strip() if profile_in.phone else None
        if profile_in.avatar_url is not None:
            user.avatar_url = profile_in.avatar_url.strip() if profile_in.avatar_url else None
        if profile_in.avatar_public_id is not None:
            user.avatar_public_id = profile_in.avatar_public_id.strip() if profile_in.avatar_public_id else None

        await self.db.commit()
        await self.db.refresh(user)
        await cache_service.delete(f"fundo:perms:{user_id}")
        return user

    async def change_password(
        self,
        user_id: uuid.UUID,
        current_password: str,
        new_password: str,
        confirm_new_password: str
    ) -> bool:
        if new_password != confirm_new_password:
            raise BadRequestException("New password and confirmation password do not match.")
        if len(new_password) < 6:
            raise BadRequestException("New password must be at least 6 characters long.")

        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)

        if not verify_password(current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect.")

        user.hashed_password = hash_password(new_password)
        await self.db.commit()
        await cache_service.delete(f"fundo:perms:{user_id}")
        return True
