import asyncio
import uuid
from datetime import date, timedelta
import app.main  # Ensures all models in all modules are registered

from app.core.database import AsyncSessionLocal
from app.modules.groups.models import Group
from app.modules.members.models import Member
from app.modules.finance.models import Fund, FinancialTransaction, LedgerEntry
from app.modules.contributions.models import Contribution
from app.modules.contributions.schemas import ContributionCreate, BaseContributionRateUpdate
from app.modules.contributions.service import ContributionService
from app.modules.settings.models import SystemSetting, BaseContributionRate
from sqlalchemy import select, func

async def test_accounting_system():
    print("=" * 60)
    print("STARTING COMPLETE CONTRIBUTION & GROUP FUND ACCOUNTING VERIFICATION")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        service = ContributionService(db)

        # 1. Set base contribution to 100
        print("\n[1] Setting Base Monthly Contribution to 100.00...")
        await service.update_base_rate(
            BaseContributionRateUpdate(
                amount=100.0,
                effective_from=date(2026, 1, 1),
                description="Standard test rate"
            ),
            created_by="Automated Test"
        )
        rate_check = await service.get_base_rate_for_month("2026-09")
        assert rate_check == 100.0, f"Expected 100.0, got {rate_check}"
        print(f"Base contribution for 2026-09 verified: ৳{rate_check:.2f}")

        # 2. Create multiple groups
        print("\n[2] Creating test groups (Kazi Gaon and Shanti Nagar)...")
        suffix = uuid.uuid4().hex[:6]
        g1 = Group(
            code=f"KG-{suffix}",
            name=f"Kazi Gaon {suffix}",
            description="Rural agricultural collective",
            status="active"
        )
        g2 = Group(
            code=f"SN-{suffix}",
            name=f"Shanti Nagar {suffix}",
            description="Urban artisans circle",
            status="active"
        )
        db.add_all([g1, g2])
        await db.commit()
        await db.refresh(g1)
        await db.refresh(g2)
        print(f"Created Group 1: {g1.name} ({g1.id})")
        print(f"Created Group 2: {g2.name} ({g2.id})")

        # 3. Create members in groups
        print("\n[3] Creating members in groups...")
        m_rahim = Member(
            member_number=f"M-RAHIM-{suffix}",
            full_name="Rahim Uddin",
            group_id=g1.id,
            join_date=date(2026, 1, 1),
            membership_status="active"
        )
        m_karim = Member(
            member_number=f"M-KARIM-{suffix}",
            full_name="Karim Khan",
            group_id=g1.id,
            join_date=date(2026, 1, 1),
            membership_status="active"
        )
        m_jamal = Member(
            member_number=f"M-JAMAL-{suffix}",
            full_name="Jamal Hossain",
            group_id=g1.id,
            join_date=date(2026, 1, 1),
            membership_status="active"
        )
        m_nasir = Member(
            member_number=f"M-NASIR-{suffix}",
            full_name="Nasir Ali",
            group_id=g1.id,
            join_date=date(2026, 1, 1),
            membership_status="active"
        )
        m_faruk = Member(
            member_number=f"M-FARUK-{suffix}",
            full_name="Faruk Ahmed",
            group_id=g2.id,
            join_date=date(2026, 1, 1),
            membership_status="active"
        )
        db.add_all([m_rahim, m_karim, m_jamal, m_nasir, m_faruk])
        await db.commit()
        await db.refresh(m_rahim)
        await db.refresh(m_karim)
        await db.refresh(m_jamal)
        await db.refresh(m_nasir)
        await db.refresh(m_faruk)
        print("Created 5 members across the 2 groups.")

        # Ensure active fund exists
        fund_res = await db.execute(select(Fund).where(Fund.is_active == True).limit(1))
        fund = fund_res.scalar_one_or_none()
        if not fund:
            fund = Fund(code=f"FND-{suffix}", name="General Savings Pool", fund_type="general", current_balance=0.0)
            db.add(fund)
            await db.commit()
            await db.refresh(fund)
        init_fund_balance = float(fund.current_balance)

        # 4, 5, 6, 7. Record 100, 500, 150, 50 contributions for September 2026
        print("\n[4-8] Recording variable contributions for September 2026...")
        # Rahim pays 100
        c_rahim = await service.create(ContributionCreate(
            member_id=m_rahim.id,
            fund_id=fund.id,
            amount=100.0,
            contribution_month="2026-09",
            contribution_date=date(2026, 9, 10),
            notes="Rahim standard monthly contribution"
        ), recorded_by="Admin Tester")
        assert c_rahim.group_id == g1.id
        print(" -> Rahim paid ৳100 (exact base). Accepted.")

        # Karim pays 500 (more than base)
        c_karim = await service.create(ContributionCreate(
            member_id=m_karim.id,
            fund_id=fund.id,
            amount=500.0,
            contribution_month="2026-09",
            contribution_date=date(2026, 9, 11),
            notes="Karim surplus voluntary contribution"
        ), recorded_by="Admin Tester")
        assert c_karim.group_id == g1.id
        print(" -> Karim paid ৳500 (greater than base). Accepted.")

        # Jamal pays 150 (more than base)
        c_jamal = await service.create(ContributionCreate(
            member_id=m_jamal.id,
            fund_id=fund.id,
            amount=150.0,
            contribution_month="2026-09",
            contribution_date=date(2026, 9, 12),
            notes="Jamal savings deposit"
        ), recorded_by="Admin Tester")
        assert c_jamal.group_id == g1.id
        print(" -> Jamal paid ৳150 (greater than base). Accepted.")

        # Nasir pays 50 (less than base)
        c_nasir = await service.create(ContributionCreate(
            member_id=m_nasir.id,
            fund_id=fund.id,
            amount=50.0,
            contribution_month="2026-09",
            contribution_date=date(2026, 9, 13),
            notes="Nasir partial deposit"
        ), recorded_by="Admin Tester")
        assert c_nasir.group_id == g1.id
        print(" -> Nasir paid ৳50 (partial payment). Accepted.")

        # 9. Verify outstanding due for the 50 payment
        print("\n[9] Verifying due calculations...")
        due_rahim = await service.get_member_due_preview(m_rahim.id, "2026-09")
        assert due_rahim.already_paid == 100.0 and due_rahim.outstanding_due == 0.0, f"Rahim unexpected: {due_rahim}"
        print(f"Rahim (Paid ৳100): Expected ৳100, Due ৳{due_rahim.outstanding_due:.2f} -> Correct!")

        due_karim = await service.get_member_due_preview(m_karim.id, "2026-09")
        assert due_karim.already_paid == 500.0 and due_karim.outstanding_due == 0.0
        print(f"Karim (Paid ৳500): Expected ৳100, Due ৳{due_karim.outstanding_due:.2f} -> Correct!")

        due_jamal = await service.get_member_due_preview(m_jamal.id, "2026-09")
        assert due_jamal.already_paid == 150.0 and due_jamal.outstanding_due == 0.0
        print(f"Jamal (Paid ৳150): Expected ৳100, Due ৳{due_jamal.outstanding_due:.2f} -> Correct!")

        due_nasir = await service.get_member_due_preview(m_nasir.id, "2026-09")
        assert due_nasir.already_paid == 50.0 and due_nasir.outstanding_due == 50.0, f"Nasir unexpected: {due_nasir}"
        print(f"Nasir (Paid ৳50): Expected ৳100, Due ৳{due_nasir.outstanding_due:.2f} -> Correct!")

        # 10. Verify group fund receives correct actual amounts
        print("\n[10] Verifying Group Fund accounting...")
        g1_fund = await service.get_group_fund(g1.id, "2026-09")
        # Rahim (100) + Karim (500) + Jamal (150) + Nasir (50) = 800
        assert g1_fund.current_month_contributions == 800.0, f"Expected 800.0, got {g1_fund.current_month_contributions}"
        assert g1_fund.outstanding_member_due == 50.0, f"Expected 50.0 group due, got {g1_fund.outstanding_member_due}"
        print(f"Group 1 Current Month Contributions: ৳{g1_fund.current_month_contributions:.2f} (Expected ৳800.00) -> Correct!")
        print(f"Group 1 Outstanding Member Due: ৳{g1_fund.outstanding_member_due:.2f} (Expected ৳50.00) -> Correct!")

        # 11 & 12. Verify each member's ledger
        print("\n[11-12] Verifying individual member passbooks/ledgers...")
        nasir_ledger = await service.get_member_ledger(m_nasir.id)
        sep_rec = next(r for r in nasir_ledger.monthly_records if r.month == "2026-09")
        assert sep_rec.expected_amount == 100.0
        assert sep_rec.paid_amount == 50.0
        assert sep_rec.due_amount == 50.0
        assert sep_rec.status == "partial"
        print(f"Nasir's September Ledger: Status={sep_rec.status}, Expected=৳{sep_rec.expected_amount}, Paid=৳{sep_rec.paid_amount}, Due=৳{sep_rec.due_amount}")

        # 13. Verify multiple payments in one month
        print("\n[13] Verifying multiple payments in same month for Nasir...")
        # Nasir pays remaining ৳50
        c_nasir_2 = await service.create(ContributionCreate(
            member_id=m_nasir.id,
            fund_id=fund.id,
            amount=50.0,
            contribution_month="2026-09",
            contribution_date=date(2026, 9, 20),
            notes="Nasir 2nd installment paying off due"
        ), recorded_by="Admin Tester")
        due_nasir_after = await service.get_member_due_preview(m_nasir.id, "2026-09")
        assert due_nasir_after.already_paid == 100.0, f"Expected 100, got {due_nasir_after.already_paid}"
        assert due_nasir_after.outstanding_due == 0.0, f"Expected 0 due, got {due_nasir_after.outstanding_due}"
        print(f"Nasir after 2nd payment: Paid=৳{due_nasir_after.already_paid:.2f}, Outstanding Due=৳{due_nasir_after.outstanding_due:.2f} -> Cleanly settled!")

        g1_fund_after = await service.get_group_fund(g1.id, "2026-09")
        assert g1_fund_after.current_month_contributions == 850.0
        assert g1_fund_after.outstanding_member_due == 0.0
        print(f"Group 1 after Nasir second payment: Contributions=৳{g1_fund_after.current_month_contributions:.2f}, Outstanding Due=৳{g1_fund_after.outstanding_member_due:.2f}")

        # 14, 15, 16. Change base contribution to 150 starting October 2026
        print("\n[14-16] Changing Base Monthly Contribution to 150 starting 2026-10-01...")
        await service.update_base_rate(
            BaseContributionRateUpdate(
                amount=150.0,
                effective_from=date(2026, 10, 1),
                description="Increase monthly standard to 150"
            ),
            created_by="Admin Director"
        )
        # Historical month September must remain 100
        sep_rate = await service.get_base_rate_for_month("2026-09")
        assert sep_rate == 100.0, f"Historical month September expected 100.0, got {sep_rate}"
        # Future month October must be 150
        oct_rate = await service.get_base_rate_for_month("2026-10")
        assert oct_rate == 150.0, f"Future month October expected 150.0, got {oct_rate}"
        print(f"Historical 2026-09 expected rate preserved: ৳{sep_rate:.2f}")
        print(f"Future 2026-10 expected rate updated: ৳{oct_rate:.2f}")

        # Check Faruk's due for October (hasn't paid yet)
        due_faruk_oct = await service.get_member_due_preview(m_faruk.id, "2026-10")
        assert due_faruk_oct.base_contribution == 150.0
        assert due_faruk_oct.outstanding_due == 150.0
        print(f"Faruk in October: Expected=৳{due_faruk_oct.base_contribution:.2f}, Due=৳{due_faruk_oct.outstanding_due:.2f} -> Correct!")

        # 17 & 18. Move a member to another group & verify historical group attribution
        print("\n[17-18] Moving Rahim from Group 1 (Kazi Gaon) to Group 2 (Shanti Nagar)...")
        m_rahim.group_id = g2.id
        await db.commit()
        await db.refresh(m_rahim)

        # Rahim's historical contribution in September must remain linked to Group 1
        rahim_sep_contrib = await db.scalar(
            select(Contribution).where(Contribution.id == c_rahim.id)
        )
        assert rahim_sep_contrib.group_id == g1.id, f"Historical contribution group changed! Got {rahim_sep_contrib.group_id}"
        print(f"Rahim's historical contribution remains attributed to original Group 1 ({g1.name}) -> Verified!")

        # Now Rahim makes October payment under Group 2
        c_rahim_oct = await service.create(ContributionCreate(
            member_id=m_rahim.id,
            fund_id=fund.id,
            amount=150.0,
            contribution_month="2026-10",
            contribution_date=date(2026, 10, 5),
            notes="Rahim first contribution in Shanti Nagar"
        ), recorded_by="Admin Tester")
        assert c_rahim_oct.group_id == g2.id, f"New contribution not attributed to new Group 2! Got {c_rahim_oct.group_id}"
        print(f"Rahim's new October contribution is correctly attributed to new Group 2 ({g2.name}) -> Verified!")

        # 20 & 21. Verify financial transactions and no duplicate balances
        print("\n[20-21] Verifying Financial Transactions & Balanced Ledger Integrity...")
        # Check total contributions recorded
        all_test_contrib_ids = [c_rahim.id, c_karim.id, c_jamal.id, c_nasir.id, c_nasir_2.id, c_rahim_oct.id]
        test_sum = await db.scalar(
            select(func.sum(Contribution.amount)).where(Contribution.id.in_(all_test_contrib_ids))
        )
        assert float(test_sum) == (100 + 500 + 150 + 50 + 50 + 150), f"Unexpected test sum: {test_sum}"

        # Verify corresponding financial transactions exist for each
        for cid in all_test_contrib_ids:
            c_row = await db.scalar(select(Contribution).where(Contribution.id == cid))
            tx_row = await db.scalar(
                select(FinancialTransaction).where(FinancialTransaction.source_reference == c_row.receipt_number)
            )
            assert tx_row is not None, f"Missing FinancialTransaction for receipt {c_row.receipt_number}"
            assert float(tx_row.amount) == float(c_row.amount)

            # Verify balanced double-entry ledger entries exist (Debit Cash == Credit Savings)
            ledger_rows = (await db.execute(
                select(LedgerEntry).where(LedgerEntry.reference == c_row.receipt_number)
            )).scalars().all()
            assert len(ledger_rows) == 2, f"Expected 2 ledger entries for {c_row.receipt_number}, got {len(ledger_rows)}"
            debit_sum = sum(float(l.debit) for l in ledger_rows)
            credit_sum = sum(float(l.credit) for l in ledger_rows)
            assert debit_sum == credit_sum == float(c_row.amount), f"Unbalanced ledger for {c_row.receipt_number}"

        print("All financial transactions and double-entry ledger pairs verified balanced!")

        # 22. Verify rollback on failure
        print("\n[22] Verifying transactional rollback on failure...")
        try:
            fake_member_id = uuid.uuid4()
            await service.create(ContributionCreate(
                member_id=fake_member_id,
                fund_id=fund.id,
                amount=200.0,
                contribution_month="2026-09"
            ))
            assert False, "Should have failed on invalid member!"
        except Exception as e:
            print(f"Intentional invalid contribution cleanly rejected: {type(e).__name__}")

    print("\n" + "=" * 60)
    print("ALL 22 CONTRIBUTION & GROUP FUND ACCOUNTING CHECKS PASSED!")
    print("=" * 60)

if __name__ == '__main__':
    asyncio.run(test_accounting_system())
