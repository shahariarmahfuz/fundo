from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.reports.schemas import DashboardSummaryResponse, FinancialReportResponse
from app.modules.reports.service import ReportsService
from app.modules.users.router import require_roles
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = ReportsService(db)
    return await service.get_dashboard_summary()


@router.get("/financial", response_model=FinancialReportResponse)
async def get_financial_report(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = ReportsService(db)
    return await service.get_financial_report()
