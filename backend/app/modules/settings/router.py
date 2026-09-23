from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.settings.schemas import SettingResponse, SettingUpdate
from app.modules.settings.service import SettingsService
from app.modules.users.router import require_permission
from app.modules.users.models import User

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/public", response_model=Dict[str, str])
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    return await service.get_public_settings()


@router.get("", response_model=List[SettingResponse])
async def list_settings(
    category: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("settings.view")),
    db: AsyncSession = Depends(get_db)
):
    service = SettingsService(db)
    settings_list = await service.list_settings(category=category)
    return [SettingResponse.model_validate(s) for s in settings_list]


@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    setting_in: SettingUpdate,
    current_user: User = Depends(require_permission("settings.edit")),
    db: AsyncSession = Depends(get_db)
):
    service = SettingsService(db)
    setting = await service.update_setting(key, setting_in)
    return SettingResponse.model_validate(setting)
