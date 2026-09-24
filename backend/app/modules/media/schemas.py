import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MediaAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    provider: str
    public_id: str
    secure_url: str
    resource_type: str
    format: Optional[str] = None
    bytes_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    purpose: str
    folder: str
    original_filename: Optional[str] = None
    created_at: datetime


class MediaUploadResponse(BaseModel):
    success: bool = True
    message: str = "Media uploaded successfully"
    asset: MediaAssetResponse
    url: str
    public_id: str


class MediaSignatureResponse(BaseModel):
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str


class ProfileAvatarResponse(BaseModel):
    success: bool = True
    avatar_url: Optional[str] = None
    avatar_public_id: Optional[str] = None
    detail: str
