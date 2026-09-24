import time
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import BadRequestException, ForbiddenException
from app.modules.users.models import User
from app.modules.users.router import get_current_user, build_user_response
from app.modules.users.schemas import UserResponse
from app.modules.media.schemas import (
    MediaUploadResponse,
    MediaAssetResponse,
    MediaSignatureResponse,
)
from app.modules.media.constants import PURPOSE_FOLDER_MAPPING
from app.modules.media.service import MediaService
from app.modules.media.cloudinary_service import cloudinary_service

router = APIRouter(prefix="/media", tags=["Media Management"])


@router.post("/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    purpose: str = Form("profile"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Universal media upload endpoint.
    - Validates file constraints (size, extension, and binary content).
    - Uploads securely to Cloudinary using isolated server-side credentials.
    - Persists media asset record in the database.
    """
    clean_purpose = purpose.lower().strip()
    if clean_purpose not in PURPOSE_FOLDER_MAPPING:
        raise BadRequestException(
            f"Invalid upload purpose '{purpose}'. Allowed purposes: {list(PURPOSE_FOLDER_MAPPING.keys())}"
        )

    # Permission check: Any authenticated user can upload their own profile media.
    # Administrative purposes require admin privileges or media.upload permission.
    if clean_purpose != "profile" and not current_user.is_superadmin:
        has_perm = any(
            p in getattr(current_user, "user_permissions", []) or "media.upload" in [perm.code for r in current_user.roles for perm in r.permissions]
            for p in ["media.upload"]
        )
        if not has_perm and current_user.role not in ("admin", "manager"):
            raise ForbiddenException("You do not have permission to upload general media assets.")

    file_bytes = await file.read()
    if not file_bytes:
        raise BadRequestException("Uploaded file is empty.")

    service = MediaService(db)
    asset = await service.upload_media(
        file_bytes=file_bytes,
        filename=file.filename or "uploaded_media.jpg",
        content_type=file.content_type,
        purpose=clean_purpose,
        user_id=current_user.id
    )

    return MediaUploadResponse(
        success=True,
        message="Media uploaded successfully",
        asset=MediaAssetResponse.model_validate(asset),
        url=asset.secure_url,
        public_id=asset.public_id
    )


@router.post("/profile/avatar", response_model=UserResponse)
async def upload_profile_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dedicated endpoint to upload/replace the current user's profile avatar.
    - Performs validation and transforms image to an optimized square avatar.
    - Safely removes the previous Cloudinary asset after successful upload.
    - Updates user profile reference and returns updated user object.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise BadRequestException("Uploaded image is empty.")

    service = MediaService(db)
    updated_user = await service.update_user_avatar(
        user=current_user,
        file_bytes=file_bytes,
        filename=file.filename or "profile_avatar.jpg",
        content_type=file.content_type
    )

    return await build_user_response(updated_user, db)


@router.delete("/profile/avatar", response_model=UserResponse)
async def remove_profile_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Removes the current user's profile avatar and deletes the asset from Cloudinary.
    """
    service = MediaService(db)
    updated_user = await service.remove_user_avatar(current_user)
    return await build_user_response(updated_user, db)


@router.delete("/{asset_id}")
async def delete_media_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a media asset from Cloudinary and database.
    """
    service = MediaService(db)
    is_admin = current_user.is_superadmin or current_user.role == "admin"
    await service.delete_media(asset_id=asset_id, user=current_user, is_admin=is_admin)
    return {"success": True, "detail": "Media asset deleted successfully"}


@router.post("/signature", response_model=MediaSignatureResponse)
async def get_upload_signature(
    purpose: str = Form("profile"),
    current_user: User = Depends(get_current_user)
):
    """
    Returns signed parameters for direct-to-Cloudinary client uploads without exposing the API secret.
    """
    clean_purpose = purpose.lower().strip()
    if clean_purpose not in PURPOSE_FOLDER_MAPPING:
        raise BadRequestException(f"Invalid purpose: {purpose}")

    folder = PURPOSE_FOLDER_MAPPING[clean_purpose]
    timestamp = int(time.time())

    params_to_sign = {
        "folder": folder,
        "timestamp": timestamp,
    }

    signature = cloudinary_service.generate_signature(params_to_sign)

    return MediaSignatureResponse(
        signature=signature,
        timestamp=timestamp,
        api_key=settings.CLOUDINARY_API_KEY or "",
        cloud_name=settings.CLOUDINARY_CLOUD_NAME or "",
        folder=folder
    )
