from typing import Optional, List, Dict, Any, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.modules.members.models import Member
from app.modules.beneficiaries.models import Beneficiary
from app.modules.groups.models import Group
from app.modules.finance.models import Fund, Donation, FinancialTransaction
from app.modules.contributions.models import Contribution
from app.modules.loans.models import Loan
from app.modules.reports.schemas import DashboardSummaryResponse, FundMetric, FinancialReportResponse


class ReportsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_summary(
        self,
        user_permissions: Set[str],
        is_superadmin: bool = False
    ) -> DashboardSummaryResponse:
        total_members = None
        active_members = None
        total_beneficiaries = None
        total_groups = None
        total_funds_balance = None
        total_donations = None
        total_contributions = None
        total_loans_disbursed = None
        active_loans_count = None
        total_loans_outstanding = None
        fund_dist = None

        # 1. Members
        if is_superadmin or "members.view" in user_permissions:
            total_members = await self.db.scalar(select(func.count(Member.id))) or 0
            active_members = await self.db.scalar(
                select(func.count(Member.id)).where(Member.membership_status == "active")
            ) or 0

        # 2. Beneficiaries
        if is_superadmin or "beneficiaries.view" in user_permissions:
            total_beneficiaries = await self.db.scalar(select(func.count(Beneficiary.id))) or 0

        # 3. Groups
        if is_superadmin or "groups.view" in user_permissions:
            total_groups = await self.db.scalar(select(func.count(Group.id))) or 0

        # 4. Finance & Funds
        if is_superadmin or "finance.view" in user_permissions:
            funds_res = await self.db.execute(select(Fund).where(Fund.is_active == True))
            funds = funds_res.scalars().all()
            total_funds_balance = round(sum(float(f.current_balance) for f in funds), 2)
            fund_dist = [
                FundMetric(
                    name=f.name,
                    code=f.code,
                    balance=float(f.current_balance),
                    fund_type=f.fund_type
                )
                for f in funds
            ]

        # 5. Donations
        if is_superadmin or "donations.view" in user_permissions:
            d_sum = await self.db.scalar(
                select(func.sum(Donation.amount)).where(Donation.status == "completed")
            ) or 0.0
            total_donations = round(float(d_sum), 2)

        # 6. Contributions
        if is_superadmin or "contributions.view" in user_permissions:
            c_sum = await self.db.scalar(
                select(func.sum(Contribution.amount)).where(Contribution.status == "completed")
            ) or 0.0
            total_contributions = round(float(c_sum), 2)

        # 7. Loans
        if is_superadmin or "loans.view" in user_permissions:
            loans_res = await self.db.execute(select(Loan))
            all_loans = loans_res.scalars().all()
            total_loans_disbursed = round(sum(float(l.principal_amount) for l in all_loans), 2)
            active_loans = [l for l in all_loans if l.status == "active"]
            active_loans_count = len(active_loans)
            total_loans_outstanding = round(
                sum(
                    max(0.0, float(l.total_repayable) - float(l.total_repaid))
                    for l in active_loans
                ),
                2
            )

        return DashboardSummaryResponse(
            total_members=total_members,
            active_members=active_members,
            total_beneficiaries=total_beneficiaries,
            total_groups=total_groups,
            total_funds_balance=total_funds_balance,
            total_donations=total_donations,
            total_contributions=total_contributions,
            total_loans_disbursed=total_loans_disbursed,
            active_loans_count=active_loans_count,
            total_loans_outstanding=total_loans_outstanding,
            fund_distribution=fund_dist
        )

    async def get_financial_report(self) -> FinancialReportResponse:
        funds_res = await self.db.execute(select(Fund).where(Fund.is_active == True))
        funds = funds_res.scalars().all()
        total_funds_balance = sum(float(f.current_balance) for f in funds)
        fund_dist = [
            FundMetric(
                name=f.name,
                code=f.code,
                balance=float(f.current_balance),
                fund_type=f.fund_type
            )
            for f in funds
        ]

        total_donations = await self.db.scalar(
            select(func.sum(Donation.amount)).where(Donation.status == "completed")
        ) or 0.0

        total_contributions = await self.db.scalar(
            select(func.sum(Contribution.amount)).where(Contribution.status == "completed")
        ) or 0.0

        loans_res = await self.db.execute(select(Loan))
        all_loans = loans_res.scalars().all()
        active_loans = [l for l in all_loans if l.status == "active"]
        total_loan_receivables = sum(
            max(0.0, float(l.total_repayable) - float(l.total_repaid))
            for l in active_loans
        )

        total_assets = total_funds_balance + total_loan_receivables
        total_liabilities = total_contributions

        return FinancialReportResponse(
            total_assets=round(total_assets, 2),
            total_liabilities=round(total_liabilities, 2),
            total_donations=round(float(total_donations), 2),
            total_member_savings=round(float(total_contributions), 2),
            total_loan_receivables=round(total_loan_receivables, 2),
            funds=fund_dist,
            monthly_trend=[]
        )
