import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.pagination import PaginatedResponse
from app.modules.finance.schemas import (
    FundCreate,
    FundUpdate,
    FundResponse,
    DonationCreate,
    DonationResponse,
    FinancialTransactionResponse,
    LedgerEntryResponse
)
from app.modules.finance.service import FinanceService
from app.modules.users.router import require_roles
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/finance", tags=["Finance & Accounting"])


# --- FUNDS ---
@router.get("/funds", response_model=List[FundResponse])
async def list_funds(
    active_only: bool = Query(False),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    funds = await service.list_funds(active_only=active_only)
    return [FundResponse.model_validate(f) for f in funds]


@router.post("/funds", response_model=FundResponse, status_code=status.HTTP_201_CREATED)
async def create_fund(
    fund_in: FundCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    fund = await service.create_fund(fund_in)
    return FundResponse.model_validate(fund)


# --- SADAQA & DONATIONS ---
@router.get("/donations", response_model=PaginatedResponse[DonationResponse])
async def list_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    fund_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_donations(
        skip=skip,
        limit=page_size,
        search=search,
        fund_id=fund_id,
        category=category
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    resp_items = [
        DonationResponse(
            id=d.id,
            receipt_number=d.receipt_number,
            donor_name=d.donor_name,
            donor_email=d.donor_email,
            donor_phone=d.donor_phone,
            is_anonymous=d.is_anonymous,
            amount=float(d.amount),
            donation_category=d.donation_category,
            fund_id=d.fund_id,
            fund_name=d.fund.name if d.fund else None,
            payment_method=d.payment_method,
            payment_reference=d.payment_reference,
            status=d.status,
            notes=d.notes,
            donation_date=d.donation_date,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in items
    ]

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/donations", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
    d_in: DonationCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    donation = await service.create_donation(d_in, created_by=current_user.full_name)
    return DonationResponse(
        id=donation.id,
        receipt_number=donation.receipt_number,
        donor_name=donation.donor_name,
        donor_email=donation.donor_email,
        donor_phone=donation.donor_phone,
        is_anonymous=donation.is_anonymous,
        amount=float(donation.amount),
        donation_category=donation.donation_category,
        fund_id=donation.fund_id,
        fund_name=donation.fund.name if donation.fund else None,
        payment_method=donation.payment_method,
        payment_reference=donation.payment_reference,
        status=donation.status,
        notes=donation.notes,
        donation_date=donation.donation_date,
        created_at=donation.created_at,
        updated_at=donation.updated_at
    )


# --- FINANCIAL TRANSACTIONS AUDIT TRAIL ---
@router.get("/transactions", response_model=PaginatedResponse[FinancialTransactionResponse])
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    fund_id: Optional[uuid.UUID] = Query(None),
    transaction_type: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_transactions(
        skip=skip,
        limit=page_size,
        fund_id=fund_id,
        transaction_type=transaction_type
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    resp_items = [
        FinancialTransactionResponse(
            id=t.id,
            transaction_number=t.transaction_number,
            fund_id=t.fund_id,
            fund_name=t.fund.name if t.fund else None,
            transaction_type=t.transaction_type,
            category=t.category,
            amount=float(t.amount),
            balance_after=float(t.balance_after),
            source_module=t.source_module,
            source_reference=t.source_reference,
            description=t.description,
            created_by=t.created_by,
            transaction_date=t.transaction_date,
            created_at=t.created_at
        )
        for t in items
    ]

    return PaginatedResponse(
        items=resp_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# --- GENERAL LEDGERS ---
@router.get("/ledgers", response_model=PaginatedResponse[LedgerEntryResponse])
async def list_ledger_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    account_type: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.VIEWER)),
    db: AsyncSession = Depends(get_db)
):
    service = FinanceService(db)
    skip = (page - 1) * page_size
    items, total = await service.list_ledger_entries(
        skip=skip,
        limit=page_size,
        account_type=account_type
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(
        items=[LedgerEntryResponse.model_validate(l) for l in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
