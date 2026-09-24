import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.cache import cache_service
from app.core.logging import setup_logging
from app.core.exceptions import AppException

# Import routers from business modules
from app.modules.users.router import router as users_router
from app.modules.public.router import router as public_router
from app.modules.members.router import router as members_router
from app.modules.beneficiaries.router import router as beneficiaries_router
from app.modules.groups.router import router as groups_router
from app.modules.contributions.router import router as contributions_router
from app.modules.loans.router import router as loans_router
from app.modules.qard_hasanah.router import router as qard_hasanah_router
from app.modules.sadaqa.router import router as sadaqa_router
from app.modules.finance.router import router as finance_router
from app.modules.reports.router import router as reports_router
from app.modules.settings.router import router as settings_router
from app.modules.member_applications.router import (
    admin_router as member_applications_router,
    public_router as public_member_applications_router
)

setup_logging()
logger = logging.getLogger("fundo.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Fundo Foundation Platform Backend...")
    # 1. Connect cache (Redis or in-memory fallback)
    await cache_service.connect()

    # 2. Verify Database connectivity
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Neon PostgreSQL connection verified successfully.")
    except Exception as e:
        logger.error(f"Database connection error: {e}")

    yield

    logger.info("Shutting down Fundo Foundation Platform Backend...")
    await cache_service.disconnect()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Modular Monolith Backend for Foundation Management & Public Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": exc.error_code,
            "detail": exc.detail,
            "data": exc.data
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error processing request {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "detail": "An unexpected error occurred. Please contact the administrator."
        }
    )


# Health Check
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


# Register Modular API Routers
v1_prefix = settings.API_V1_PREFIX

app.include_router(users_router, prefix=v1_prefix)
app.include_router(public_router, prefix=v1_prefix)
app.include_router(members_router, prefix=v1_prefix)
app.include_router(beneficiaries_router, prefix=v1_prefix)
app.include_router(groups_router, prefix=v1_prefix)
app.include_router(contributions_router, prefix=v1_prefix)
app.include_router(loans_router, prefix=v1_prefix)
app.include_router(qard_hasanah_router, prefix=v1_prefix)
app.include_router(sadaqa_router, prefix=v1_prefix)
app.include_router(finance_router, prefix=v1_prefix)
app.include_router(reports_router, prefix=v1_prefix)
app.include_router(settings_router, prefix=v1_prefix)
app.include_router(public_member_applications_router, prefix=v1_prefix)
app.include_router(member_applications_router, prefix=v1_prefix)
