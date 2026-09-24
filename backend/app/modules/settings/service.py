from typing import Optional, List, Dict
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.settings.models import SystemSetting
from app.modules.settings.schemas import SettingUpdate
from app.core.exceptions import NotFoundException
from app.core.cache import cache_service


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_settings(self, category: Optional[str] = None) -> List[SystemSetting]:
        query = select(SystemSetting)
        if category:
            query = query.where(SystemSetting.category == category)
        result = await self.db.execute(query.order_by(SystemSetting.key.asc()))
        return list(result.scalars().all())

    async def get_public_settings(self) -> Dict[str, str]:
        cache_key = "settings:public"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached

        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.is_public == True)
        )
        settings_map = {s.key: s.value for s in result.scalars().all()}
        await cache_service.set(cache_key, settings_map, ttl=600)
        return settings_map

    async def update_setting(self, key: str, setting_in: SettingUpdate) -> SystemSetting:
        result = await self.db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalar_one_or_none()
        if not setting:
            raise NotFoundException("SystemSetting", key)

        setting.value = setting_in.value
        if setting_in.description is not None:
            setting.description = setting_in.description
        if setting_in.is_public is not None:
            setting.is_public = setting_in.is_public

        if key == "base_monthly_contribution":
            try:
                new_amt = float(setting_in.value)
                from app.modules.contributions.service import ContributionService
                from app.modules.contributions.schemas import BaseContributionRateUpdate
                contrib_svc = ContributionService(self.db)
                await contrib_svc.update_base_rate(
                    BaseContributionRateUpdate(
                        amount=new_amt,
                        description=setting_in.description or "Updated via system settings"
                    )
                )
            except Exception as e:
                # If conversion fails or already handled, continue
                pass

        await self.db.commit()
        await self.db.refresh(setting)
        await cache_service.delete("settings:public")
        return setting

