from typing import Dict, List, Set

# Allowed purposes mapped to their controlled Cloudinary folder paths
PURPOSE_FOLDER_MAPPING: Dict[str, str] = {
    "profile": "foundation/profiles",
    "member": "foundation/members",
    "beneficiary": "foundation/beneficiaries",
    "document": "foundation/documents",
    "gallery": "foundation/gallery",
    "project": "foundation/projects",
    "general": "foundation/general",
}

# Image validation rules
ALLOWED_IMAGE_MIME_TYPES: Dict[str, List[str]] = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
}

ALLOWED_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".webp"}

ALLOWED_PIL_FORMATS: Set[str] = {"JPEG", "PNG", "WEBP"}

DEFAULT_MAX_IMAGE_SIZE_MB = 5
