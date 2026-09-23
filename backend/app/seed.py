import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import hash_password
from app.modules.users.models import User, UserRole
from app.modules.public.models import (
    PublicSection,
    PublicProject,
    PublicStory,
    PublicNewsPost,
    PublicLeadership
)
from app.modules.groups.models import Group
from app.modules.members.models import Member
from app.modules.beneficiaries.models import Beneficiary
from app.modules.finance.models import Fund, Donation, FinancialTransaction, LedgerEntry
from app.modules.contributions.models import Contribution
from app.modules.loans.models import Loan, LoanRepayment
from app.modules.settings.models import SystemSetting


async def seed_database():
    print("Beginning database seed in Neon PostgreSQL...")
    async with AsyncSessionLocal() as session:
        # 1. Admin Users
        user_check = await session.execute(select(func.count(User.id)))
        if user_check.scalar() == 0:
            print("Seeding administrative users...")
            admin_user = User(
                email="admin@fundo.org",
                hashed_password=hash_password("admin123456"),
                full_name="Dr. Amina Rahman",
                role=UserRole.SUPERADMIN,
                phone="+1 (555) 019-2834",
                is_active=True
            )
            staff_user = User(
                email="staff@fundo.org",
                hashed_password=hash_password("staff123456"),
                full_name="Kareem Tariq",
                role=UserRole.STAFF,
                phone="+1 (555) 014-9912",
                is_active=True
            )
            session.add_all([admin_user, staff_user])
            await session.commit()
            print("Users seeded.")

        # 2. System Settings
        settings_check = await session.execute(select(func.count(SystemSetting.id)))
        if settings_check.scalar() == 0:
            print("Seeding system settings...")
            defaults = [
                SystemSetting(key="site_name", value="Fundo Foundation", category="general", is_public=True, description="Organization public brand name"),
                SystemSetting(key="contact_email", value="contact@fundo.org", category="general", is_public=True, description="Official public inquiries email"),
                SystemSetting(key="contact_phone", value="+1 (800) 555-FUNDO", category="general", is_public=True, description="Toll-free foundation hotline"),
                SystemSetting(key="foundation_address", value="100 Global Hope Way, Suite 400, Geneva / New York", category="general", is_public=True, description="Headquarters physical address"),
                SystemSetting(key="default_currency", value="USD", category="currency", is_public=True, description="Operating foundation currency"),
                SystemSetting(key="tax_exempt_number", value="501(c)(3) EIN: 82-4910294", category="general", is_public=True, description="Charitable registry tax exemption code"),
            ]
            session.add_all(defaults)
            await session.commit()
            print("Settings seeded.")

        # 3. Public Sections
        sec_check = await session.execute(select(func.count(PublicSection.id)))
        if sec_check.scalar() == 0:
            print("Seeding dynamic public website content sections...")
            sections = [
                PublicSection(
                    section_key="hero",
                    title="Empowering Communities Through Transparent & Sustainable Action",
                    subtitle="Fundo Foundation pioneers ethical micro-financing, community-driven development, and verifiable charitable impact.",
                    content="We bridge philanthropic capital and grassroots resilience through rigorous stewardship, non-interest community financing, and transparent accountability.",
                    metadata_json={
                        "cta_primary": "Explore Projects",
                        "cta_primary_link": "/projects",
                        "cta_secondary": "Financial Transparency",
                        "cta_secondary_link": "/transparency",
                        "stats": [
                            {"label": "Direct Beneficiaries", "value": "48,500+"},
                            {"label": "Capital Deployed", "value": "$4.2M"},
                            {"label": "Community Groups", "value": "120+"},
                            {"label": "Repayment Success", "value": "99.4%"}
                        ]
                    },
                    display_order=1
                ),
                PublicSection(
                    section_key="about",
                    title="About Fundo Foundation",
                    subtitle="A legacy of ethical stewardship and grassroots transformation since 2018.",
                    content="Founded on the principles of community solidarity, social equity, and absolute financial transparency, Fundo Foundation operates in under-served regions across the globe to build durable social safety nets and dignified livelihood opportunities.",
                    metadata_json={
                        "core_pillars": ["Zero-Interest Micro-Finance", "Transparent Zakat & Sadaqa Pool", "Community-Led Governance", "Verifiable Impact Auditing"]
                    },
                    display_order=2
                ),
                PublicSection(
                    section_key="mission",
                    title="Our Mission",
                    subtitle="Fostering self-reliance and dignity.",
                    content="Our mission is to alleviate systemic poverty and vulnerability by facilitating equitable capital access, high-impact humanitarian interventions, and community-owned wealth building.",
                    metadata_json={"focus_areas": ["Economic Inclusion", "Education Sponsorship", "Emergency Aid", "Water Infrastructure"]},
                    display_order=3
                ),
                PublicSection(
                    section_key="vision",
                    title="Our Vision",
                    subtitle="A world where every community possesses the financial and social freedom to thrive.",
                    content="We envision resilient, self-governing societies where vulnerability does not dictate human destiny, and where ethical capital circulates continuously to elevate generations.",
                    display_order=4
                ),
                PublicSection(
                    section_key="goals",
                    title="Strategic Goals 2026-2030",
                    subtitle="Targeted milestones for sustainable collective advancement.",
                    content="Over the next decade, Fundo Foundation is expanding its revolving community micro-pools to touch 100,000 households while upholding our benchmark zero-overhead commitment for designated Zakat and emergency distributions.",
                    display_order=5
                ),
                PublicSection(
                    section_key="transparency",
                    title="Financial Transparency & Open Ledgers",
                    subtitle="Every dollar accounted for. Real-time balance sheets and third-party verified audits.",
                    content="We believe non-profit trust must be earned through verifiable truth. Our double-entry ledgers, monthly bank reconciliation reports, and external audit statements are publicly accessible for all donors and members.",
                    metadata_json={
                        "independent_auditor": "Deloitte & Touche LLP",
                        "rating": "Platinum Seal of Transparency 2026",
                        "program_efficiency_ratio": "94.8%"
                    },
                    display_order=6
                )
            ]
            session.add_all(sections)
            await session.commit()
            print("Public sections seeded.")

        # 4. Public Projects
        proj_check = await session.execute(select(func.count(PublicProject.id)))
        if proj_check.scalar() == 0:
            print("Seeding public foundation projects...")
            projects = [
                PublicProject(
                    slug="clean-water-wells",
                    title="Solar-Powered Deep Water Wells",
                    category="Infrastructure & Water",
                    description="Constructing deep solar-powered borehole water wells providing sustainable clean drinking water to over 15,000 rural residents in arid zones.",
                    target_amount=85000.0,
                    raised_amount=68400.0,
                    location="Turkana & Garissa Regions",
                    image_url="https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80",
                    status="active",
                    beneficiary_count=15200,
                    is_featured=True
                ),
                PublicProject(
                    slug="micro-enterprise-seed-capital",
                    title="Women Artisan Micro-Enterprise Fund",
                    category="Economic Empowerment",
                    description="Zero-interest revolving capital facilities enabling female-led artisan cooperatives to scale textile, agricultural, and artisanal craft production.",
                    target_amount=120000.0,
                    raised_amount=114000.0,
                    location="Multan & Swat Valley",
                    image_url="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
                    status="active",
                    beneficiary_count=840,
                    is_featured=True
                ),
                PublicProject(
                    slug="orphan-education-scholarships",
                    title="STEM & Vocational Orphan Sponsorship",
                    category="Education",
                    description="Comprehensive academic scholarships covering tuition, technical supplies, boarding, and mentorship for vulnerable orphans.",
                    target_amount=95000.0,
                    raised_amount=95000.0,
                    location="Nationwide Centers",
                    image_url="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
                    status="completed",
                    beneficiary_count=450,
                    is_featured=True
                )
            ]
            session.add_all(projects)
            await session.commit()
            print("Projects seeded.")

        # 5. Public Leadership
        lead_check = await session.execute(select(func.count(PublicLeadership.id)))
        if lead_check.scalar() == 0:
            print("Seeding leadership profiles...")
            leaders = [
                PublicLeadership(
                    name="Dr. Amina Rahman",
                    role_title="Executive Director & Board Chairperson",
                    bio="Former UN Development Programme senior advisor with 20+ years steering international ethical micro-finance frameworks.",
                    category="board",
                    display_order=1
                ),
                PublicLeadership(
                    name="Tariq Mansoor, CPA",
                    role_title="Chief Financial Officer & Compliance Lead",
                    bio="Chartered accountant specializing in Islamic finance jurisprudence, statutory endowment audit, and transparent public reporting.",
                    category="executive",
                    display_order=2
                ),
                PublicLeadership(
                    name="Dr. Fatima Al-Hassan",
                    role_title="Director of Field Operations & Community Impact",
                    bio="Public health specialist and community organizer with extensive field coordination experience in over 14 emerging nations.",
                    category="executive",
                    display_order=3
                )
            ]
            session.add_all(leaders)
            await session.commit()
            print("Leadership seeded.")

        # 6. Public Stories & News
        story_check = await session.execute(select(func.count(PublicStory.id)))
        if story_check.scalar() == 0:
            stories = [
                PublicStory(
                    slug="from-subsistence-to-flourishing-workshop",
                    title="From Subsistence to Independence: Zahra's Sewing Collective",
                    summary="How an initial $350 zero-interest revolving loan empowered a mother of four to employ 8 neighborhood women.",
                    content="Zahra started in a single room with a borrowed manual sewing machine. Through Fundo Foundation's micro-enterprise pool, she secured working capital to purchase bulk fabric and electric machinery. Today, her workshop produces school uniforms for three regional academies.",
                    author="Fatima Al-Hassan",
                    category="Economic Empowerment"
                ),
                PublicStory(
                    slug="clean-water-changes-an-entire-village",
                    title="Flowing Dignity: Safe Water Arrives in Baraza",
                    summary="Children in Baraza village no longer walk 6 miles daily to fetch contaminated river water.",
                    content="With the commissioning of Solar Borehole #14, over 2,000 residents gained direct tap access to pure aquifer water. School attendance rates jumped by 42% in just one academic semester.",
                    author="Field Correspondent",
                    category="Water & Sanitation"
                )
            ]
            news = [
                PublicNewsPost(
                    slug="q3-2026-financial-audit-released",
                    post_type="report",
                    title="Q3 2026 Comprehensive Financial Audit & Impact Metrics Released",
                    excerpt="Fundo Foundation publishes its third-quarter external audit review detailing $1.2M in programmatic disbursements.",
                    content="In line with our permanent transparency pledge, our Q3 external audit conducted by certified auditors is now open for public review."
                ),
                PublicNewsPost(
                    slug="annual-foundation-symposium-announced",
                    post_type="news",
                    title="Annual Global Community Development Symposium 2026",
                    excerpt="Leaders, beneficiaries, and grassroots delegates will convene in November to chart the next generation of social funds.",
                    content="Join us for three days of keynotes, impact roundtables, and project spotlights."
                )
            ]
            session.add_all(stories + news)
            await session.commit()
            print("Stories & news seeded.")

        # 7. Funds
        funds_check = await session.execute(select(func.count(Fund.id)))
        if funds_check.scalar() == 0:
            print("Seeding foundational funds...")
            fund_gen = Fund(
                code="GEN-01",
                name="General Operations & Humanitarian Fund",
                fund_type="general",
                current_balance=164500.0,
                description="Core foundation fund supporting operations and unrestricted humanitarian response."
            )
            fund_zak = Fund(
                code="ZAK-02",
                name="Zakat & Sadaqa Charitable Relief Pool",
                fund_type="sadaqa_zakat",
                current_balance=98200.0,
                description="100% policy restricted fund strictly for designated beneficiaries and emergency welfare."
            )
            fund_loan = Fund(
                code="REV-03",
                name="Qard Hasan Micro-Loan Revolving Pool",
                fund_type="loan_pool",
                current_balance=135000.0,
                description="Revolving capital pool for interest-free member loans and livelihood creation."
            )
            fund_edu = Fund(
                code="EDU-04",
                name="Orphan & Student Education Endowment",
                fund_type="endowment",
                current_balance=72000.0,
                description="Endowment fund dedicated to tuition grants, books, and educational supplies."
            )
            session.add_all([fund_gen, fund_zak, fund_loan, fund_edu])
            await session.commit()
            await session.refresh(fund_gen)
            await session.refresh(fund_zak)
            await session.refresh(fund_loan)
            await session.refresh(fund_edu)
            print("Funds seeded.")

            # 8. Groups & Members
            print("Seeding community groups & members...")
            grp1 = Group(code="GRP-EAST-01", name="Unity Savings Circle", region="Eastern District", meeting_frequency="weekly")
            grp2 = Group(code="GRP-WEST-02", name="Barakah Cooperative Guild", region="Western Highland", meeting_frequency="bi-weekly")
            grp3 = Group(code="GRP-CENT-03", name="Hope Community Cluster", region="Central Valley", meeting_frequency="monthly")
            session.add_all([grp1, grp2, grp3])
            await session.commit()
            await session.refresh(grp1)
            await session.refresh(grp2)
            await session.refresh(grp3)

            members = [
                Member(member_number="MBR-1001", full_name="Zahra Binte Qasim", national_id="NAT-883921", phone="+1 (555) 234-9011", email="zahra.q@example.com", gender="female", group_id=grp1.id, membership_status="active", join_date=date(2023, 2, 14)),
                Member(member_number="MBR-1002", full_name="Ibrahim Dawud", national_id="NAT-774012", phone="+1 (555) 441-2094", email="ibrahim.d@example.com", gender="male", group_id=grp1.id, membership_status="active", join_date=date(2023, 4, 1)),
                Member(member_number="MBR-1003", full_name="Maryam Noor", national_id="NAT-993104", phone="+1 (555) 772-8819", email="maryam.n@example.com", gender="female", group_id=grp2.id, membership_status="active", join_date=date(2023, 6, 10)),
                Member(member_number="MBR-1004", full_name="Hamza Yusuf", national_id="NAT-551029", phone="+1 (555) 883-4920", email="hamza.y@example.com", gender="male", group_id=grp2.id, membership_status="active", join_date=date(2023, 8, 20)),
                Member(member_number="MBR-1005", full_name="Aisha Bilal", national_id="NAT-339102", phone="+1 (555) 991-3829", email="aisha.b@example.com", gender="female", group_id=grp3.id, membership_status="active", join_date=date(2024, 1, 15)),
                Member(member_number="MBR-1006", full_name="Tariq Ziyad", national_id="NAT-110294", phone="+1 (555) 332-9018", email="tariq.z@example.com", gender="male", group_id=grp3.id, membership_status="active", join_date=date(2024, 3, 5)),
            ]
            session.add_all(members)
            await session.commit()
            for m in members:
                await session.refresh(m)

            # 9. Beneficiaries
            print("Seeding beneficiaries...")
            beneficiaries = [
                Beneficiary(beneficiary_code="BEN-2001", full_name="Khadija Omar & Family", category="widow", phone="+1 (555) 112-9034", location="East Suburb Sector 4", assistance_type="financial", total_aid_received=2400.0, status="active"),
                Beneficiary(beneficiary_code="BEN-2002", full_name="Saeed Al-Kindi", category="disability", phone="+1 (555) 884-2910", location="Valley Clinic Ward", assistance_type="healthcare", total_aid_received=3800.0, status="active"),
                Beneficiary(beneficiary_code="BEN-2003", full_name="Yusuf Children Orphan Home", category="orphan", phone="+1 (555) 662-8172", location="North District Compound", assistance_type="educational", total_aid_received=8500.0, status="active"),
                Beneficiary(beneficiary_code="BEN-2004", full_name="Hassan Jameel", category="student", phone="+1 (555) 440-1928", location="University Quarters", assistance_type="educational", total_aid_received=1500.0, status="graduated")
            ]
            session.add_all(beneficiaries)
            await session.commit()

            # 10. Sample Donations (Sadaqa)
            print("Seeding donations...")
            donations = [
                Donation(receipt_number="RCP-2026-001", donor_name="Sheikh Abdullah Al-Sabah", amount=25000.0, donation_category="zakat", fund_id=fund_zak.id, payment_method="bank_transfer", payment_reference="WIRE-99210", donation_date=date(2026, 8, 15)),
                Donation(receipt_number="RCP-2026-002", donor_name="Anonymous Philanthropist", is_anonymous=True, amount=10000.0, donation_category="sadaqa", fund_id=fund_zak.id, payment_method="card", payment_reference="STR-77291", donation_date=date(2026, 8, 28)),
                Donation(receipt_number="RCP-2026-003", donor_name="Global Civic Partners Trust", amount=50000.0, donation_category="general", fund_id=fund_gen.id, payment_method="bank_transfer", payment_reference="WIRE-10023", donation_date=date(2026, 9, 2)),
                Donation(receipt_number="RCP-2026-004", donor_name="Community Solidarity Network", amount=15000.0, donation_category="emergency", fund_id=fund_zak.id, payment_method="bank_transfer", payment_reference="WIRE-44102", donation_date=date(2026, 9, 10))
            ]
            session.add_all(donations)
            await session.commit()

            # 11. Sample Member Contributions
            print("Seeding member contributions...")
            contribs = [
                Contribution(receipt_number="CON-2026-101", member_id=members[0].id, fund_id=fund_gen.id, amount=150.0, contribution_type="monthly_savings", payment_method="mobile_money", contribution_date=date(2026, 9, 1)),
                Contribution(receipt_number="CON-2026-102", member_id=members[1].id, fund_id=fund_gen.id, amount=200.0, contribution_type="monthly_savings", payment_method="bank_transfer", contribution_date=date(2026, 9, 2)),
                Contribution(receipt_number="CON-2026-103", member_id=members[2].id, fund_id=fund_gen.id, amount=150.0, contribution_type="monthly_savings", payment_method="mobile_money", contribution_date=date(2026, 9, 3)),
                Contribution(receipt_number="CON-2026-104", member_id=members[3].id, fund_id=fund_gen.id, amount=300.0, contribution_type="shares", payment_method="bank_transfer", contribution_date=date(2026, 9, 5)),
            ]
            session.add_all(contribs)
            await session.commit()

            # 12. Sample Loans
            print("Seeding loans...")
            loan1 = Loan(
                loan_number="LN-2026-001",
                member_id=members[0].id,
                fund_id=fund_loan.id,
                principal_amount=3000.0,
                interest_rate=0.0,
                term_months=12,
                monthly_installment=250.0,
                total_repayable=3000.0,
                total_repaid=1500.0,
                status="active",
                disbursement_date=date(2026, 3, 1),
                due_date=date(2027, 3, 1),
                purpose="Purchase commercial embroidery machine and bulk cotton spools."
            )
            loan2 = Loan(
                loan_number="LN-2026-002",
                member_id=members[2].id,
                fund_id=fund_loan.id,
                principal_amount=2400.0,
                interest_rate=0.0,
                term_months=12,
                monthly_installment=200.0,
                total_repayable=2400.0,
                total_repaid=800.0,
                status="active",
                disbursement_date=date(2026, 5, 1),
                due_date=date(2027, 5, 1),
                purpose="Organic honey harvesting and certified glass packaging."
            )
            session.add_all([loan1, loan2])
            await session.commit()

            # 13. Financial Transactions Audit Trail
            print("Seeding transactions audit trail...")
            txs = [
                FinancialTransaction(transaction_number="TXN-2026-001", fund_id=fund_zak.id, transaction_type="credit", category="donation", amount=25000.0, balance_after=88200.0, source_module="finance", description="Zakat contribution received from Sheikh Abdullah Al-Sabah", transaction_date=date(2026, 8, 15)),
                FinancialTransaction(transaction_number="TXN-2026-002", fund_id=fund_zak.id, transaction_type="credit", category="donation", amount=10000.0, balance_after=98200.0, source_module="finance", description="Anonymous Sadaqa received", transaction_date=date(2026, 8, 28)),
                FinancialTransaction(transaction_number="TXN-2026-003", fund_id=fund_gen.id, transaction_type="credit", category="donation", amount=50000.0, balance_after=164000.0, source_module="finance", description="General grant from Global Civic Partners Trust", transaction_date=date(2026, 9, 2)),
                FinancialTransaction(transaction_number="TXN-2026-004", fund_id=fund_loan.id, transaction_type="debit", category="loan_disbursement", amount=3000.0, balance_after=132000.0, source_module="loans", description="Disbursed Loan LN-2026-001 to Zahra Binte Qasim", transaction_date=date(2026, 3, 1)),
                FinancialTransaction(transaction_number="TXN-2026-005", fund_id=fund_loan.id, transaction_type="credit", category="loan_repayment", amount=500.0, balance_after=135000.0, source_module="loans", description="Loan repayment installment for LN-2026-001", transaction_date=date(2026, 8, 30)),
            ]
            session.add_all(txs)

            # 14. Ledger Entries
            ledgers = [
                LedgerEntry(entry_number="JRN-INIT-01", account_code="1010", account_name="Cash & Bank Assets", account_type="asset", debit=469700.0, credit=0.0, description="Opening Foundation Balances", entry_date=date(2026, 8, 1)),
                LedgerEntry(entry_number="JRN-INIT-01", account_code="3010", account_name="Foundation Capital & Reserves", account_type="equity", debit=0.0, credit=469700.0, description="Opening Capital Allocation", entry_date=date(2026, 8, 1)),
            ]
            session.add_all(ledgers)
            await session.commit()
            print("Transactions and ledgers seeded.")

    print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_database())
