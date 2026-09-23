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
    TokenResponse
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
    # Accept token from Authorization header or HttpOnly cookie
    auth_token = token or cookie_token
    if not auth_token:
        # Also check request.cookies directly in case alias parsing varies
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
        if current_user.role not in allowed_roles and current_user.role != UserRole.SUPERADMIN:
            raise ForbiddenException("Insufficient permissions for this operation")
        return current_user
    return role_checker


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

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
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
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_users(skip=skip, limit=page_size, search=search)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.create(user_in)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.update(user_id, user_in)
