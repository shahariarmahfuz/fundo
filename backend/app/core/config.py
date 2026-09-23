from typing import List, Union
import json
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Fundo Foundation Platform"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "fundo-foundation-ultra-secure-key-2026-production-ready-jwt-secret-998877"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:npg_hMlvcr8eJZC3@ep-cold-boat-b3zgf7wb-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?ssl=require"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_PRE_PING: bool = True

    # Cache (Redis)
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_ENABLED: bool = True
    CACHE_DEFAULT_TTL: int = 300  # 5 minutes

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
