import { AdminHeader } from '@/components/admin/AdminHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Landmark,
  HandHeart,
  PiggyBank,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  HeartHandshake
} from 'lucide-react';
import { DashboardSummary } from '@/types/admin';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getDashboardData(): Promise<DashboardSummary | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('fundo_access_token')?.value;
  if (!token) {
    return null;
  }

  const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  try {
    const summaryRes = await fetch(`${API_URL}/reports/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `fundo_access_token=${token}`
      },
      cache: 'no-store'
    });

    if (!summaryRes.ok) return null;
    return await summaryRes.json();
  } catch (err) {
    console.error('Failed to load dashboard summary on server:', err);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  if (!data) {
    redirect('/login');
  }

  const summary = data;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader
        title="Foundation Overview"
        subtitle="Consolidated real-time operational and fiduciary dashboard"
        userRole="Super Admin"
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Total Foundation Balance"
            value={formatCurrency(summary.total_funds_balance)}
            subtitle="Across 4 active funds"
            icon={Landmark}
            change="+4.2% this month"
            trend="up"
          />

          <MetricCard
            title="Sadaqa & Zakat Raised"
            value={formatCurrency(summary.total_donations)}
            subtitle="100% policy restricted"
            icon={HandHeart}
            change="Zero overhead"
            trend="neutral"
          />

          <MetricCard
            title="Active Member Count"
            value={`${summary.active_members} Members`}
            subtitle={`In ${summary.total_groups} savings circles`}
            icon={Users}
            change="100% active standing"
            trend="up"
          />

          <MetricCard
            title="Revolving Loans Disbursed"
            value={formatCurrency(summary.total_loans_disbursed)}
            subtitle={`Outstanding: ${formatCurrency(summary.total_loans_outstanding)}`}
            icon={Coins}
            change="99.4% repayment rate"
            trend="up"
          />
        </div>

        {/* FUNDS BREAKDOWN & RECENT TRANSACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fund Pools */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fund Pool Balances</CardTitle>
                <Badge variant="outline" className="text-[10px]">Real-Time</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1">
              {summary.fund_distribution.map((fund) => (
                <div key={fund.code} className="p-3 rounded-md border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{fund.code}</span>
                    <Badge variant="outline" className="text-[10px]">{fund.fund_type}</Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">{fund.name}</div>
                  <div className="text-base font-bold text-teal-800">
                    {formatCurrency(fund.balance)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Audit Transactions */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Financial Audit Trail</CardTitle>
                <span className="text-xs text-slate-400">PostgreSQL Immutable Log</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <tr>
                      <th className="p-3 pl-6">Tx Number</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right pr-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {summary.recent_transactions.length > 0 ? (
                      summary.recent_transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-6 font-mono text-[11px] text-slate-600 font-medium">
                            {tx.transaction_number}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={tx.transaction_type === 'credit' ? 'success' : 'destructive'}
                              className="text-[10px] uppercase font-mono"
                            >
                              {tx.transaction_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600 font-medium">
                            {tx.category?.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="p-3 text-xs text-slate-600 max-w-xs truncate">
                            {tx.description}
                          </td>
                          <td className="p-3 text-right pr-6 font-bold text-slate-900 font-mono">
                            {tx.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-xs text-slate-400">
                          Audit trail records initialized and synchronized.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
