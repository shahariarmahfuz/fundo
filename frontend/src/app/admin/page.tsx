import { AdminHeader } from '@/components/admin/AdminHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Landmark,
  HandHeart,
  PiggyBank,
  Coins,
  HeartHandshake
} from 'lucide-react';
import { DashboardSummary } from '@/types/admin';
import { User } from '@/types/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getDashboardData(): Promise<{ summary: DashboardSummary | null; user: User | null }> {
  const cookieStore = cookies();
  const token = cookieStore.get('fundo_access_token')?.value;
  if (!token) {
    return { summary: null, user: null };
  }

  const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  try {
    const [summaryRes, meRes] = await Promise.all([
      fetch(`${API_URL}/reports/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `fundo_access_token=${token}`
        },
        cache: 'no-store'
      }),
      fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `fundo_access_token=${token}`
        },
        cache: 'no-store'
      })
    ]);

    const summary = summaryRes.ok ? await summaryRes.json() : null;
    const user = meRes.ok ? await meRes.json() : null;
    return { summary, user };
  } catch (err) {
    console.error('Failed to load dashboard summary on server:', err);
    return { summary: null, user: null };
  }
}

export default async function AdminDashboardPage() {
  const { summary, user } = await getDashboardData();
  if (!summary || !user) {
    redirect('/login');
  }

  const roleDisplay = user.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Foundation Overview"
        subtitle={`Consolidated operational dashboard for ${user.full_name}`}
        userRole={roleDisplay}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0">
        {/* PERMISSION-AWARE METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 min-w-0 w-full">
          {/* 1. Total Foundation Balance (finance.view) */}
          {summary.total_funds_balance !== null && summary.total_funds_balance !== undefined && (
            <MetricCard
              title="Total Foundation Balance"
              value={formatCurrency(summary.total_funds_balance)}
              subtitle="Across active fiduciary funds"
              icon={Landmark}
              change="Verified active"
              trend="up"
            />
          )}

          {/* 2. Sadaqa & Zakat Raised (donations.view) */}
          {summary.total_donations !== null && summary.total_donations !== undefined && (
            <MetricCard
              title="Sadaqa & Donations"
              value={formatCurrency(summary.total_donations)}
              subtitle="Direct philanthropic contributions"
              icon={HandHeart}
              change="100% policy restricted"
              trend="neutral"
            />
          )}

          {/* 3. Members Count (members.view) */}
          {summary.total_members !== null && summary.total_members !== undefined && (
            <MetricCard
              title="Active Members"
              value={`${summary.active_members ?? summary.total_members} Members`}
              subtitle={summary.total_groups ? `In ${summary.total_groups} registered circles` : 'Enrolled community members'}
              icon={Users}
              change="Registered members"
              trend="up"
            />
          )}

          {/* 4. Loans Disbursed (loans.view) */}
          {summary.total_loans_disbursed !== null && summary.total_loans_disbursed !== undefined && (
            <MetricCard
              title="Revolving Loans Disbursed"
              value={formatCurrency(summary.total_loans_disbursed)}
              subtitle={summary.total_loans_outstanding ? `Outstanding: ${formatCurrency(summary.total_loans_outstanding)}` : 'Micro-finance disbursements'}
              icon={Coins}
              change="Active credit cycle"
              trend="up"
            />
          )}

          {/* 5. Member Savings & Contributions (contributions.view) */}
          {summary.total_contributions !== null && summary.total_contributions !== undefined && (
            <MetricCard
              title="Member Savings"
              value={formatCurrency(summary.total_contributions)}
              subtitle="Mutual solidarity deposits"
              icon={PiggyBank}
              change="Cumulative deposits"
              trend="up"
            />
          )}

          {/* 6. Beneficiaries Supported (beneficiaries.view) */}
          {summary.total_beneficiaries !== null && summary.total_beneficiaries !== undefined && (
            <MetricCard
              title="Beneficiaries Supported"
              value={`${summary.total_beneficiaries} Individuals`}
              subtitle="Direct humanitarian assistance"
              icon={HeartHandshake}
              change="Targeted aid delivery"
              trend="up"
            />
          )}
        </div>

        {/* FUND POOL BREAKDOWN (Rendered only if authorized for finance.view) */}
        {summary.fund_distribution && summary.fund_distribution.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.fund_distribution.map((fund) => (
              <Card key={fund.code} className="p-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold">{fund.code}</span>
                    <Badge variant="outline" className="text-[10px]">{fund.fund_type}</Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">{fund.name}</div>
                </div>
                <div className="text-base font-bold text-teal-800 mt-2">
                  {formatCurrency(fund.balance)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
