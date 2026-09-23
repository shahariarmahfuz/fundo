from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.reports.schemas import DashboardSummaryResponse, FinancialReportResponse
from app.modules.reports.service import ReportsService
from app.modules.users.router import get_current_user, require_permission
from app.modules.users.service import UserService
from app.modules.users.models import User

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    perms = set(await user_service.get_user_permissions(current_user.id))
    service = ReportsService(db)
    return await service.get_dashboard_summary(
        user_permissions=perms,
        is_superadmin=current_user.is_superadmin
    )


@router.get("/financial", response_model=FinancialReportResponse)
async def get_financial_report(
    current_user: User = Depends(require_permission("finance.view")),
    db: AsyncSession = Depends(get_db)
):
    service = ReportsService(db)
    return await service.get_financial_report()
