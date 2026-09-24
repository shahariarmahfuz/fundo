'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';
import { Contribution, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PiggyBank, Search, ArrowLeft, Printer, FileText, Download, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function ContributionReportPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFund, setSelectedFund] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    async function loadData() {
      if (!hasPermission('contributions.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [resC, resF] = await Promise.all([
          ApiClient.get<PaginatedResponse<Contribution>>('/contributions?page=1&page_size=250').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);
        setContributions((resC as PaginatedResponse<Contribution>).items || []);
        setFunds((resF as Fund[]) || []);
      } catch (err) {
        console.error('Failed to load contribution report data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('contributions.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Contribution Report"
          subtitle="Audit reconciliation and capital inflow reports"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="contributions.view"
          message="You do not have authorization to view contribution reports."
        />
      </div>
    );
  }

  const filteredContributions = contributions.filter((c) => {
    const matchesSearch =
      (c.receipt_number && c.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.member_name && c.member_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.member_number && c.member_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.payment_reference && c.payment_reference.toLowerCase().includes(search.toLowerCase()));

    const matchesFund = selectedFund === 'all' || c.fund_id === selectedFund;
    const matchesType = selectedType === 'all' || c.contribution_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesFund && matchesType && matchesStatus;
  });

  const totalVolume = filteredContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const completedVolume = filteredContributions
    .filter((c) => c.status === 'completed' || c.status === 'paid')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const pendingVolume = filteredContributions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Contribution Report"
        subtitle="Historical audit reconciliation, settlement journals, and ledger inflows"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Contributions</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Audit Report</span>
            </Button>
          </div>
        </div>

        {/* Report Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Filtered Report Volume</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalVolume)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{filteredContributions.length} records in scope</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Settled & Cleared</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(completedVolume)}</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">ACID verified balance</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Pending Settlement</p>
              <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(pendingVolume)}</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting bank verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card className="border border-slate-100 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <span>Audit Reconciliation Ledger</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search receipt, member..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <select
                  value={selectedFund}
                  onChange={(e) => setSelectedFund(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Funds</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="monthly_savings">Monthly Savings</option>
                  <option value="equity_shares">Equity Shares</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="special_deposit">Special Deposit</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading report records...</div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No contribution records found matching the active filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Settlement Date</th>
                      <th className="py-3 px-4">Member Info</th>
                      <th className="py-3 px-4">Target Fund</th>
                      <th className="py-3 px-4">Contribution Type</th>
                      <th className="py-3 px-4">Method & Ref</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContributions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {c.receipt_number || 'REC-AUTO'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {c.contribution_date ? formatDate(c.contribution_date) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{c.member_name}</div>
                          {c.member_number && (
                            <div className="text-[10px] text-slate-400 font-mono">{c.member_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {c.fund_name || 'General Savings'}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700">
                          {c.contribution_type?.replace(/_/g, ' ') || 'Savings'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div className="capitalize">{c.payment_method?.replace(/_/g, ' ') || 'Cash'}</div>
                          {c.payment_reference && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                              {c.payment_reference}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              c.status === 'completed' || c.status === 'paid'
                                ? 'success'
                                : c.status === 'pending'
                                ? 'warning'
                                : 'outline'
                            }
                            className="capitalize text-[10px]"
                          >
                            {c.status || 'completed'}
                          </Badge>
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
