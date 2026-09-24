import io
import os
import uuid
import logging
from typing import Optional, Tuple
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.cache import cache_service
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    ForbiddenException,
)
from app.modules.media.models import MediaAsset
from app.modules.media.constants import (
    PURPOSE_FOLDER_MAPPING,
    ALLOWED_EXTENSIONS,
    ALLOWED_PIL_FORMATS,
    ALLOWED_IMAGE_MIME_TYPES,
)
from app.modules.media.cloudinary_service import cloudinary_service
from app.modules.users.models import User

logger = logging.getLogger("fundo.media.service")


class MediaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def validate_image(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None
    ) -> Tuple[str, int, int]:
        """
        Validates file size, file extension, and inspects actual image bytes using Pillow.
        Returns (format, width, height).
        """
        # 1. Size Validation
        max_bytes = settings.MEDIA_MAX_IMAGE_SIZE_MB * 1024 * 1024
        file_size = len(file_bytes)
        if file_size > max_bytes:
            raise BadRequestException(
                f"File size exceeds the maximum limit of {settings.MEDIA_MAX_IMAGE_SIZE_MB}MB."
            )
        if file_size == 0:
            raise BadRequestException("Uploaded file is empty.")

        # 2. Extension Validation
        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise BadRequestException(
                f"Unsupported file format '{ext}'. Only JPG, PNG, and WebP images are allowed."
            )

        # 3. MIME type check if supplied
        if content_type:
            clean_mime = content_type.lower().split(";")[0].strip()
            if clean_mime not in ALLOWED_IMAGE_MIME_TYPES:
                raise BadRequestException(
                    f"Invalid MIME type '{clean_mime}'. Only JPG, PNG, and WebP images are allowed."
                )

        # 4. Deep Inspection using Pillow (Verifies actual bytes rather than just extension)
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img_format = (img.format or "").upper()
                if img_format not in ALLOWED_PIL_FORMATS:
                    raise BadRequestException(
                        f"Unsupported or invalid image content format: '{img_format}'. Only JPEG, PNG, and WebP are allowed."
                    )
                width, height = img.size
                # Verify image integrity
                img.verify()
                return img_format.lower(), width, height
        except BadRequestException:
            raise
        except Exception as e:
            logger.warning(f"Image inspection failed for {filename}: {str(e)}")
            raise BadRequestException("Corrupted or invalid image file. Please provide a valid image.")

    async def upload_media(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str],
        purpose: str = "profile",
        user_id: Optional[uuid.UUID] = None
    ) -> MediaAsset:
        """
        Universal media uploader:
        - Validates purpose and determines Cloudinary folder path
        - Validates image content and constraints
        - Performs secure Cloudinary upload
        - Saves a MediaAsset record in the database
        """
        clean_purpose = purpose.lower().strip()
        if clean_purpose not in PURPOSE_FOLDER_MAPPING:
            raise BadRequestException(
                f"Invalid upload purpose '{purpose}'. Allowed: {list(PURPOSE_FOLDER_MAPPING.keys())}"
            )

        folder = PURPOSE_FOLDER_MAPPING[clean_purpose]

        # Validate image
        img_format, width, height = self.validate_image(file_bytes, filename, content_type)

        # Apply purpose-specific transformations (e.g. face-centered square avatar for profile)
        transformation = None
        if clean_purpose == "profile":
            transformation = [
                {
                    "width": 500,
                    "height": 500,
                    "crop": "fill",
                    "gravity": "face",
                    "quality": "auto",
                    "fetch_format": "auto",
                }
            ]

        # Upload to Cloudinary
        res = cloudinary_service.upload_image(
            file_bytes=file_bytes,
            folder=folder,
            transformation=transformation
        )

        # Persist MediaAsset record
        media_asset = MediaAsset(
            provider="cloudinary",
            public_id=res["public_id"],
            secure_url=res["secure_url"],
            resource_type=res["resource_type"],
            format=res.get("format") or img_format,
            bytes_size=res.get("bytes_size") or len(file_bytes),
            width=res.get("width") or width,
            height=res.get("height") or height,
            purpose=clean_purpose,
            folder=folder,
            original_filename=filename,
            mime_type=content_type or f"image/{img_format}",
            uploaded_by=user_id
        )

        self.db.add(media_asset)
        await self.db.commit()
        await self.db.refresh(media_asset)

        return media_asset

    async def update_user_avatar(
        self,
        user: User,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str]
    ) -> User:
        """
        Uploads and updates a user's avatar.
        Safely removes the old Cloudinary asset after successful upload and DB update.
        """
        old_public_id = user.avatar_public_id

        # 1. Upload new avatar using universal media service
        media_asset = await self.upload_media(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
            purpose="profile",
            user_id=user.id
        )

        # 2. Update user profile reference
        user.avatar_url = media_asset.secure_url
        user.avatar_public_id = media_asset.public_id

        await self.db.commit()
        await self.db.refresh(user)

        # 3. Clean up old Cloudinary asset if replaced
        if old_public_id and old_public_id != media_asset.public_id:
            try:
                cloudinary_service.delete_asset(old_public_id)
                # Also clean up old media_asset record if desired
                await self.db.execute(
                    delete(MediaAsset).where(MediaAsset.public_id == old_public_id)
                )
                await self.db.commit()
            except Exception as e:
                logger.warning(f"Could not remove old asset {old_public_id}: {e}")

        # 4. Invalidate user caches
        await cache_service.delete(f"fundo:perms:{user.id}")

        return user

    async def remove_user_avatar(self, user: User) -> User:
        """
        Removes the current user's profile picture and deletes the asset from Cloudinary.
        """
        old_public_id = user.avatar_public_id

        user.avatar_url = None
        user.avatar_public_id = None

        await self.db.commit()
        await self.db.refresh(user)

        if old_public_id:
            try:
                cloudinary_service.delete_asset(old_public_id)
                await self.db.execute(
                    delete(MediaAsset).where(MediaAsset.public_id == old_public_id)
                )
                await self.db.commit()
            except Exception as e:
                logger.warning(f"Could not remove asset {old_public_id}: {e}")

        await cache_service.delete(f"fundo:perms:{user.id}")

        return user

    async def delete_media(
        self,
        asset_id: uuid.UUID,
        user: User,
        is_admin: bool = False
    ) -> bool:
        """
        Deletes a media asset with permission check.
        """
        stmt = select(MediaAsset).where(MediaAsset.id == asset_id)
        result = await self.db.execute(stmt)
        asset = result.scalar_one_or_none()

        if not asset:
            raise NotFoundException("MediaAsset", asset_id)

        # Non-admins can only delete media they uploaded
        if not is_admin and asset.uploaded_by != user.id:
            raise ForbiddenException("You are not authorized to delete this media asset.")

        # Delete from Cloudinary
        cloudinary_service.delete_asset(asset.public_id, asset.resource_type)

        # Delete from database
        await self.db.delete(asset)
        await self.db.commit()

        return True
