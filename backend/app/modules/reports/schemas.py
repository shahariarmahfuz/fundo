from typing import List, Dict, Any
from pydantic import BaseModel


class FundMetric(BaseModel):
    name: str
    code: str
    balance: float
    fund_type: str


class DashboardSummaryResponse(BaseModel):
    total_members: int
    active_members: int
    total_beneficiaries: int
    total_groups: int
    total_funds_balance: float
    total_donations: float
    total_contributions: float
    total_loans_disbursed: float
    active_loans_count: int
    total_loans_outstanding: float
    fund_distribution: List[FundMetric]
    recent_transactions: List[Dict[str, Any]]


class FinancialReportResponse(BaseModel):
    total_assets: float
    total_liabilities: float
    total_donations: float
    total_member_savings: float
    total_loan_receivables: float
    funds: List[FundMetric]
    monthly_trend: List[Dict[str, Any]]
