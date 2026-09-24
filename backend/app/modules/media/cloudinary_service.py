import logging
from typing import Optional, Dict, Any, List
import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils

from app.core.config import settings
from app.core.exceptions import AppException

logger = logging.getLogger("fundo.media.cloudinary")


class CloudinaryService:
    def __init__(self):
        self._configured = False
        self._ensure_config()

    def _ensure_config(self) -> None:
        if self._configured:
            return

        import os
        if (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        ):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            self._configured = True
            logger.info("Cloudinary configured using explicit credentials.")
        elif settings.CLOUDINARY_URL:
            os.environ["CLOUDINARY_URL"] = settings.CLOUDINARY_URL
            cloudinary.reset_config()
            self._configured = bool(cloudinary.config().api_key and cloudinary.config().api_secret)
            logger.info("Cloudinary configured using CLOUDINARY_URL.")
        else:
            logger.warning("Cloudinary credentials are not configured.")

    @property
    def is_configured(self) -> bool:
        self._ensure_config()
        return self._configured

    def upload_image(
        self,
        file_bytes: bytes,
        folder: str,
        public_id: Optional[str] = None,
        transformation: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Uploads image file bytes directly to Cloudinary into the designated folder.
        Applies optional server-controlled transformations (e.g. avatar crop/optimization).
        """
        if not self.is_configured:
            raise AppException(
                detail="Cloud storage service is not configured. Please contact the administrator.",
                status_code=503,
                error_code="STORAGE_SERVICE_UNAVAILABLE"
            )

        upload_options: Dict[str, Any] = {
            "folder": folder,
            "resource_type": "image",
            "overwrite": True,
            "unique_filename": True,
        }

        if public_id:
            upload_options["public_id"] = public_id

        if transformation:
            upload_options["transformation"] = transformation

        try:
            res = cloudinary.uploader.upload(file_bytes, **upload_options)
            logger.info(f"Cloudinary upload successful. Public ID: {res.get('public_id')}")

            return {
                "public_id": res.get("public_id"),
                "secure_url": res.get("secure_url"),
                "format": res.get("format"),
                "bytes_size": res.get("bytes"),
                "width": res.get("width"),
                "height": res.get("height"),
                "resource_type": res.get("resource_type", "image"),
            }
        except Exception as e:
            logger.error(f"Cloudinary upload error: {str(e)}")
            raise AppException(
                detail="Failed to upload media to cloud storage. Please try again.",
                status_code=502,
                error_code="STORAGE_UPLOAD_FAILED"
            )

    def delete_asset(self, public_id: str, resource_type: str = "image") -> bool:
        """
        Removes an asset from Cloudinary by public_id.
        """
        if not self.is_configured or not public_id:
            return False

        try:
            res = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            result_status = res.get("result")
            logger.info(f"Cloudinary delete for {public_id}: {result_status}")
            return result_status in ("ok", "not found")
        except Exception as e:
            logger.error(f"Cloudinary delete error for {public_id}: {str(e)}")
            return False

    def generate_signature(self, params_to_sign: Dict[str, Any]) -> str:
        """
        Generates SHA-1 signature using Cloudinary API secret for secure signed client uploads.
        """
        secret = settings.CLOUDINARY_API_SECRET
        if not secret and settings.CLOUDINARY_URL:
            # Parse secret from CLOUDINARY_URL if needed
            from urllib.parse import urlparse
            parsed = urlparse(settings.CLOUDINARY_URL)
            if parsed.password:
                secret = parsed.password

        if not secret:
            raise AppException(
                detail="Storage signature could not be generated.",
                status_code=503,
                error_code="STORAGE_SECRET_MISSING"
            )

        return cloudinary.utils.api_sign_request(params_to_sign, secret)


cloudinary_service = CloudinaryService()
