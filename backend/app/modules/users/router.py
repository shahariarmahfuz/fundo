import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    oauth2_scheme,
    decode_access_token,
    create_access_token,
    TokenPayload
)
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.pagination import PaginatedResponse
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import (
    UserResponse,
    UserCreate,
    UserUpdate,
    LoginRequest,
    TokenResponse,
    RoleResponse,
    RoleCreate,
    RoleUpdate,
    PermissionResponse,
    ProfileUpdate,
    ChangePasswordRequest
)
from app.modules.users.service import UserService
from app.core.config import settings

router = APIRouter(tags=["Users & Authentication"])


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    cookie_token: Optional[str] = Cookie(None, alias="fundo_access_token"),
    db: AsyncSession = Depends(get_db)
) -> User:
    auth_token = token or cookie_token
    if not auth_token:
        auth_token = request.cookies.get("fundo_access_token")

    if not auth_token:
        raise UnauthorizedException("Authentication token is missing")

    payload = decode_access_token(auth_token)
    if not payload:
        raise UnauthorizedException("Invalid or expired access token")

    try:
        user_uuid = uuid.UUID(payload.sub)
    except ValueError:
        raise UnauthorizedException("Invalid token subject")

    user_service = UserService(db)
    user = await user_service.get_by_id(user_uuid)
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    return user


def require_roles(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superadmin:
            return current_user
        if current_user.role not in allowed_roles:
            raise ForbiddenException("Insufficient permissions for this operation")
        return current_user
    return role_checker


def require_permission(permission_code: str):
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        if current_user.is_superadmin:
            return current_user

        user_service = UserService(db)
        perms = await user_service.get_user_permissions(current_user.id)
        if permission_code not in perms:
            raise ForbiddenException(f"Forbidden: You do not have the required permission '{permission_code}'.")
        return current_user
    return permission_checker


async def build_user_response(user: User, db: AsyncSession) -> UserResponse:
    user_service = UserService(db)
    perms = await user_service.get_user_permissions(user.id)
    roles = await user_service.get_user_roles(user.id)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        roles=roles,
        permissions=perms,
        is_superadmin=user.is_superadmin,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.authenticate(login_data.email, login_data.password)
    if not user:
        raise UnauthorizedException("Invalid email or password")

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="fundo_access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    user_resp = await build_user_response(user, db)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="fundo_access_token",
        path="/",
        httponly=True,
        samesite="lax"
    )
    return {"success": True, "detail": "Logged out successfully"}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await build_user_response(current_user, db)


@router.patch("/auth/profile", response_model=UserResponse)
async def update_my_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.update_profile(current_user.id, profile_in)
    return await build_user_response(user, db)


@router.post("/auth/change-password")
async def change_my_password(
    pwd_in: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    await service.change_password(
        user_id=current_user.id,
        current_password=pwd_in.current_password,
        new_password=pwd_in.new_password,
        confirm_new_password=pwd_in.confirm_new_password
    )
    return {"success": True, "detail": "Password changed successfully."}



# ================= User Management =================

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("users.view")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_users(skip=skip, limit=page_size, search=search)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    
    user_responses = [await build_user_response(u, db) for u in items]
    return PaginatedResponse(
        items=user_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_permission("users.create")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.create(user_in)
    return await build_user_response(user, db)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(require_permission("users.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.update(user_id, user_in)
    return await build_user_response(user, db)


# ================= Role & Permission Management =================

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    current_user: User = Depends(require_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.list_permissions()


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: User = Depends(require_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.list_roles()


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_in: RoleCreate,
    current_user: User = Depends(require_permission("roles.create")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.create_role(role_in)


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: uuid.UUID,
    role_in: RoleUpdate,
    current_user: User = Depends(require_permission("roles.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.update_role(role_id, role_in)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: uuid.UUID,
    current_user: User = Depends(require_permission("roles.delete")),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    await service.delete_role(role_id)
    return {"success": True, "detail": "Role deleted successfully"}
