import asyncio
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
# Import all models to ensure registered on Base.metadata
from app.modules.users.models import User
from app.modules.public.models import (
    PublicSection,
    PublicProject,
    PublicStory,
    PublicNewsPost,
    PublicLeadership,
    PublicInquiry
)
from app.modules.groups.models import Group
from app.modules.members.models import Member
from app.modules.member_applications.models import MemberApplication
from app.modules.beneficiaries.models import Beneficiary
from app.modules.finance.models import Fund, Donation, FinancialTransaction, LedgerEntry
from app.modules.contributions.models import Contribution
from app.modules.loans.models import Loan, LoanRepayment
from app.modules.qard_hasanah.models import QardHasanahLoan, QardHasanahRepayment
from app.modules.sadaqa.models import SadaqaDonation
from app.modules.settings.models import SystemSetting
from app.seed import seed_database

def create_tables():
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("ssl=require", "sslmode=require")
    print(f"Creating tables using sync engine connecting to Neon...")
    engine = create_engine(sync_url, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    print("All tables and indexes created successfully.")
    engine.dispose()

if __name__ == "__main__":
    create_tables()
    print("Now seeding data...")
    asyncio.run(seed_database())
    print("Database initialization and seed complete!")
