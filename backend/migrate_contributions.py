import asyncio
from sqlalchemy import text
from app.core.database import engine

async def run_migration():
    print("Running contribution and group fund accounting migration...")
    statements = [
        # 1. Create base_contribution_rates table
        """
        CREATE TABLE IF NOT EXISTS base_contribution_rates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            amount NUMERIC(14, 2) NOT NULL,
            effective_from DATE NOT NULL,
            effective_to DATE NULL,
            description TEXT NULL,
            created_by VARCHAR(255) NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_base_rates_dates ON base_contribution_rates(effective_from, effective_to)",

        # 2. Add columns to contributions table
        "ALTER TABLE contributions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE RESTRICT",
        "ALTER TABLE contributions ADD COLUMN IF NOT EXISTS contribution_month VARCHAR(7)",
        "ALTER TABLE contributions ADD COLUMN IF NOT EXISTS notes TEXT",
        "ALTER TABLE contributions ADD COLUMN IF NOT EXISTS recorded_by VARCHAR(255)",

        # 3. Backfill existing contributions
        """
        UPDATE contributions c
        SET group_id = m.group_id
        FROM members m
        WHERE c.member_id = m.id AND c.group_id IS NULL AND m.group_id IS NOT NULL
        """,
        """
        UPDATE contributions
        SET contribution_month = to_char(contribution_date, 'YYYY-MM')
        WHERE contribution_month IS NULL
        """,

        # 4. Make contribution_month NOT NULL and add indexes
        "ALTER TABLE contributions ALTER COLUMN contribution_month SET NOT NULL",
        "CREATE INDEX IF NOT EXISTS ix_contributions_member_month ON contributions(member_id, contribution_month)",
        "CREATE INDEX IF NOT EXISTS ix_contributions_group_month ON contributions(group_id, contribution_month)",
        "CREATE INDEX IF NOT EXISTS ix_contributions_month ON contributions(contribution_month)",
        "CREATE INDEX IF NOT EXISTS ix_contributions_group_id ON contributions(group_id)",

        # 5. Insert or update default setting in system_settings
        """
        INSERT INTO system_settings (id, key, value, category, description, is_public, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'base_monthly_contribution',
            '100.00',
            'financial',
            'Foundation standard base monthly contribution expected from each member (e.g. ৳100)',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (key) DO UPDATE 
        SET value = '100.00', category = 'financial', description = EXCLUDED.description, is_public = true, updated_at = NOW()
        """
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))

        # Check and insert initial rate in base_contribution_rates
        res = await conn.execute(text("SELECT count(*) FROM base_contribution_rates"))
        count = res.scalar()
        if count == 0:
            await conn.execute(text("""
                INSERT INTO base_contribution_rates (id, amount, effective_from, effective_to, description, created_by, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    100.00,
                    '2020-01-01',
                    NULL,
                    'Initial Foundation Base Monthly Contribution standard',
                    'System Migration',
                    NOW(),
                    NOW()
                )
            """))
            print("Initial base contribution rate record created.")

    print("Migration completed successfully!")

if __name__ == '__main__':
    asyncio.run(run_migration())
