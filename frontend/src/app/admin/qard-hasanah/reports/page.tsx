'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { QardHasanahReport } from '@/types/admin';
import { formatCurrency } from '@/lib/utils';
import { Coins, ArrowLeft, Printer, TrendingUp, Users, Wallet, CheckCircle2, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function QardHasanahReportsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [report, setReport] = useState<QardHasanahReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'borrowers' | 'groups'>('borrowers');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadReport() {
      if (!hasPermission('qard_hasanah.reports')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await ApiClient.get<QardHasanahReport>('/qard-hasanah/reports');
        setReport(data);
      } catch (err) {
        console.error('Failed to load Qard Hasanah reports:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadReport();
    }
  }, [authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('qard_hasanah.reports')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Qard Hasanah Reports"
          subtitle="Interest-free micro-finance portfolio analytics"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="qard_hasanah.reports"
          message="You do not have authorization to view Qard Hasanah financial reports."
        />
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const filteredBorrowers = (report?.borrower_summary || []).filter(
    (b) =>
      b.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
      b.member_number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = (report?.group_summary || []).filter(
    (g) =>
      g.group_name.toLowerCase().includes(search.toLowerCase()) ||
      g.group_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Qard Hasanah Reports"
        subtitle="Interest-free micro-finance portfolio metrics, capital reconciliation, and recovery tracking"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/qard-hasanah"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Qard Hasanah</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Report</span>
            </Button>
          </div>
        </div>

        {/* Shariah Compliance & Zero Interest Assurance Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Strictly Interest-Free Qard Hasanah Framework</h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                All capital metrics are audited at exactly 0.00% interest (zero accrual, zero compound, zero late fees).
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Recovery Ratio</div>
            <div className="text-sm font-bold text-emerald-900">
              {report && report.total_issued_amount > 0
                ? `${((report.total_principal_repaid / report.total_issued_amount) * 100).toFixed(1)}%`
                : '100%'}
            </div>
          </div>
        </div>

        {/* Portfolio Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Capital Issued</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(report?.total_issued_amount || 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{report?.total_loans_count || 0} loans issued</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                <Coins className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Principal Repaid</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {formatCurrency(report?.total_principal_repaid || 0)}
                </p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">{report?.fully_repaid_count || 0} fully cleared</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Outstanding Principal</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(report?.total_principal_outstanding || 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{report?.active_count || 0} active loans</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Delinquent / Overdue</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{report?.overdue_count || 0}</p>
                <p className="text-[11px] text-amber-600/80 mt-0.5">Zero late fees charged</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Active</div>
            <div className="text-base font-bold text-slate-800 mt-0.5">{report?.active_count || 0}</div>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Partially Repaid</div>
            <div className="text-base font-bold text-teal-700 mt-0.5">{report?.partially_repaid_count || 0}</div>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Fully Repaid</div>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{report?.fully_repaid_count || 0}</div>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Approval</div>
            <div className="text-base font-bold text-amber-700 mt-0.5">{report?.pending_count || 0}</div>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Cancelled</div>
            <div className="text-base font-bold text-slate-400 mt-0.5">{report?.cancelled_count || 0}</div>
          </div>
        </div>

        {/* Tabbed Summaries: Borrower-Level & Group-Level */}
        <Card className="border border-slate-100 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={activeTab === 'borrowers' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('borrowers')}
                  className="text-xs h-8"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Borrower Summary ({report?.borrower_summary?.length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === 'groups' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('groups')}
                  className="text-xs h-8"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Group Summary ({report?.group_summary?.length || 0})
                </Button>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder={activeTab === 'borrowers' ? 'Filter borrower...' : 'Filter group...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading report analytics...</div>
            ) : activeTab === 'borrowers' ? (
              filteredBorrowers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">No borrower records in scope.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Borrower</th>
                        <th className="py-3 px-4">Member Code</th>
                        <th className="py-3 px-4 text-center">Loans</th>
                        <th className="py-3 px-4 text-right">Total Principal</th>
                        <th className="py-3 px-4 text-right">Total Repaid</th>
                        <th className="py-3 px-4 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBorrowers.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-slate-900">{b.borrower_name}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{b.member_number}</td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{b.loans_count}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-800">
                            {formatCurrency(b.total_principal)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-emerald-700">
                            {formatCurrency(b.total_repaid)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(b.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredGroups.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No group records in scope.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Group Name</th>
                      <th className="py-3 px-4">Group Code</th>
                      <th className="py-3 px-4 text-center">Loans Count</th>
                      <th className="py-3 px-4 text-right">Total Principal</th>
                      <th className="py-3 px-4 text-right">Total Repaid</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroups.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-medium text-slate-900">{g.group_name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{g.group_code}</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">{g.loans_count}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800">
                          {formatCurrency(g.total_principal)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency(g.total_repaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(g.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
