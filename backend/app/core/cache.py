import json
import logging
import time
from typing import Any, Optional
import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("fundo.cache")


class MemoryCacheFallback:
    """In-memory fallback cache when Redis is unavailable or unconfigured."""

    def __init__(self):
        self._store: dict[str, tuple[str, float]] = {}

    def get(self, key: str) -> Optional[str]:
        if key in self._store:
            value, expires_at = self._store[key]
            if expires_at == 0 or expires_at > time.time():
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: str, ttl: int = 0) -> None:
        expires_at = time.time() + ttl if ttl > 0 else 0
        self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def delete_pattern(self, pattern: str) -> None:
        import fnmatch
        keys_to_del = [k for k in self._store if fnmatch.fnmatch(k, pattern)]
        for k in keys_to_del:
            self._store.pop(k, None)


class CacheService:
    """
    Redis-ready cache service with graceful fallback.
    Used exclusively for non-authoritative read accelerations such as:
    - Dashboard aggregate metrics
    - Public content cache
    - Settings / configuration
    """

    def __init__(self):
        self._redis_client: Optional[aioredis.Redis] = None
        self._fallback = MemoryCacheFallback()
        self._connected = False

    async def connect(self):
        if not settings.CACHE_ENABLED:
            logger.info("Cache disabled by configuration.")
            return

        try:
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
            await client.ping()
            self._redis_client = client
            self._connected = True
            logger.info("Connected to Redis cache successfully.")
        except Exception as e:
            logger.warning(
                f"Redis unavailable ({e}). Gracefully falling back to in-memory cache."
            )
            self._connected = False

    async def disconnect(self):
        if self._redis_client:
            await self._redis_client.close()
            self._connected = False

    async def get(self, key: str) -> Optional[Any]:
        if not settings.CACHE_ENABLED:
            return None
        try:
            if self._connected and self._redis_client:
                data = await self._redis_client.get(key)
            else:
                data = self._fallback.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.debug(f"Cache get error for key '{key}': {e}")
        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        if not settings.CACHE_ENABLED:
            return
        ttl = ttl if ttl is not None else settings.CACHE_DEFAULT_TTL
        try:
            serialized = json.dumps(value, default=str)
            if self._connected and self._redis_client:
                await self._redis_client.set(key, serialized, ex=ttl)
            else:
                self._fallback.set(key, serialized, ttl=ttl)
        except Exception as e:
            logger.debug(f"Cache set error for key '{key}': {e}")

    async def delete(self, key: str) -> None:
        try:
            if self._connected and self._redis_client:
                await self._redis_client.delete(key)
            else:
                self._fallback.delete(key)
        except Exception as e:
            logger.debug(f"Cache delete error for key '{key}': {e}")

    async def delete_pattern(self, pattern: str) -> None:
        try:
            if self._connected and self._redis_client:
                keys = await self._redis_client.keys(pattern)
                if keys:
                    await self._redis_client.delete(*keys)
            else:
                self._fallback.delete_pattern(pattern)
        except Exception as e:
            logger.debug(f"Cache delete_pattern error for pattern '{pattern}': {e}")


cache_service = CacheService()
