'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminReportsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!hasPermission('reports.view') && !hasPermission('finance.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await ApiClient.get<any>('/reports/financial');
        setReport(data);
      } catch (err) {
        console.error('Failed to load financial report:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission]);

  if (!authLoading && !hasPermission('reports.view') && !hasPermission('finance.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Financial Statements & Portfolio Reports"
          subtitle="Balance sheet reconciliation and portfolio reports"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="reports.view"
          message="You do not have authorization to view financial statements and reports."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Financial Statements & Portfolio Reports"
        subtitle="Balance sheet reconciliation, monthly capital flow trends, and assets/liabilities position"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0">
        {/* ASSET & LIABILITY SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-0 w-full">
          <Card className="min-w-0 w-full">
            <CardContent className="p-4 sm:p-5 space-y-1 min-w-0">
              <span className="text-xs font-medium text-slate-500">Total Capital Assets</span>
              <div className="text-2xl font-bold text-teal-800">
                {report ? formatCurrency(report.total_assets) : '$472,800.00'}
              </div>
              <div className="text-[11px] text-slate-400">Cash & loan receivables</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">Member Savings Liability</span>
              <div className="text-2xl font-bold text-slate-900">
                {report ? formatCurrency(report.total_member_savings) : '$800.00'}
              </div>
              <div className="text-[11px] text-slate-400">Member redeemable equity</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">Loan Receivables Asset</span>
              <div className="text-2xl font-bold text-slate-900">
                {report ? formatCurrency(report.total_loan_receivables) : '$3,100.00'}
              </div>
              <div className="text-[11px] text-slate-400">Active revolving loans due</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">Charitable Inflows (YTD)</span>
              <div className="text-2xl font-bold text-emerald-700">
                {report ? formatCurrency(report.total_donations) : '$100,000.00'}
              </div>
              <div className="text-[11px] text-slate-400">Sadaqa, Zakat & endowments</div>
            </CardContent>
          </Card>
        </div>

        {/* MONTHLY TRENDS TABLE */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base">5-Month Capital Inflow & Lending Velocity</CardTitle>
              <Badge variant="outline" className="text-[10px]">Comparative Trends</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Period</th>
                    <th className="p-3">Sadaqa / Donations</th>
                    <th className="p-3">Member Contributions</th>
                    <th className="p-3">Loan Disbursements</th>
                    <th className="p-3 pr-6 text-right">Net Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {report?.monthly_trend?.map((row: any) => {
                    const net = (row.donations + row.contributions) - row.disbursements;
                    return (
                      <tr key={row.month} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-semibold text-slate-900">
                          {row.month} 2026
                        </td>
                        <td className="p-3 font-medium text-emerald-700">
                          +{formatCurrency(row.donations)}
                        </td>
                        <td className="p-3 font-medium text-teal-800">
                          +{formatCurrency(row.contributions)}
                        </td>
                        <td className="p-3 font-medium text-amber-700">
                          -{formatCurrency(row.disbursements)}
                        </td>
                        <td className="p-3 pr-6 text-right font-bold text-slate-900">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
