from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class FundMetric(BaseModel):
    name: str
    code: str
    balance: float
    fund_type: str


class DashboardSummaryResponse(BaseModel):
    total_members: Optional[int] = None
    active_members: Optional[int] = None
    total_beneficiaries: Optional[int] = None
    total_groups: Optional[int] = None
    total_funds_balance: Optional[float] = None
    total_donations: Optional[float] = None
    total_contributions: Optional[float] = None
    total_loans_disbursed: Optional[float] = None
    active_loans_count: Optional[int] = None
    total_loans_outstanding: Optional[float] = None
    fund_distribution: Optional[List[FundMetric]] = None


class FinancialReportResponse(BaseModel):
    total_assets: float
    total_liabilities: float
    total_donations: float
    total_member_savings: float
    total_loan_receivables: float
    funds: List[FundMetric]
    monthly_trend: List[Dict[str, Any]]
