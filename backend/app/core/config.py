from typing import List, Union, Optional
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
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if not v:
            return v
        url = v.strip()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        url = url.replace("sslmode=", "ssl=")
        # Remove channel_binding parameter as asyncpg doesn't accept it
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        if "channel_binding" in query_params:
            query_params.pop("channel_binding")
            new_query = urlencode({k: v[0] for k, v in query_params.items()})
            url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
        return url

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

    def model_post_init(self, __context) -> None:
        if self.FRONTEND_URL:
            clean_url = self.FRONTEND_URL.strip().rstrip("/")
            if isinstance(self.CORS_ORIGINS, list):
                if clean_url not in self.CORS_ORIGINS:
                    self.CORS_ORIGINS.append(clean_url)
            elif isinstance(self.CORS_ORIGINS, str) and self.CORS_ORIGINS != "*":
                self.CORS_ORIGINS = [self.CORS_ORIGINS, clean_url]


settings = Settings()
