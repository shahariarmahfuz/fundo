'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Contribution, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PiggyBank, Search, ArrowLeft, TrendingUp, Users, Wallet, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function ContributionSummaryPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    async function loadData() {
      if (!hasPermission('contributions.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [resC, resF] = await Promise.all([
          ApiClient.get<PaginatedResponse<Contribution>>('/contributions?page=1&page_size=200').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);
        setContributions((resC as PaginatedResponse<Contribution>).items || []);
        setFunds((resF as Fund[]) || []);
      } catch (err) {
        console.error('Failed to load contribution summary data:', err);
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
          title="Contribution Summary"
          subtitle="Portfolio overview and capital accumulation metrics"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="contributions.view"
          message="You do not have authorization to view contribution summary metrics."
        />
      </div>
    );
  }

  const filteredContributions = contributions.filter((c) => {
    const matchesSearch =
      (c.receipt_number && c.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.member_name && c.member_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.member_number && c.member_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.fund_name && c.fund_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'all' || c.contribution_type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalCollected = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalCount = contributions.length;
  const avgContribution = totalCount > 0 ? totalCollected / totalCount : 0;
  const uniqueMembers = new Set(contributions.map((c) => c.member_id)).size;

  // Aggregate by type
  const typeMap: Record<string, { count: number; total: number }> = {};
  contributions.forEach((c) => {
    const t = c.contribution_type || 'other';
    if (!typeMap[t]) {
      typeMap[t] = { count: 0, total: 0 };
    }
    typeMap[t].count += 1;
    typeMap[t].total += Number(c.amount) || 0;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Contribution Summary"
        subtitle="Portfolio overview, mutual capital accumulation, and tier analytics"
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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/contributions/report"
              className="text-xs font-medium text-teal-700 hover:underline"
            >
              View Contribution Report →
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Capital Accumulated</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalCollected)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Across {totalCount} transactions</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Contributing Members</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{uniqueMembers}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active deposit holders</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Average Deposit</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(avgContribution)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Per settlement record</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Target Funds</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{funds.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active reserve pools</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aggregated breakdown by contribution type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(typeMap).map(([typeKey, data]) => (
            <Card key={typeKey} className="border border-slate-100 bg-white">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-slate-700 capitalize">
                  {typeKey.replace(/_/g, ' ')}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {formatCurrency(data.total)}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Count</span>
                  <span className="font-semibold text-slate-700">{data.count} entries</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contributions table */}
        <Card className="border border-slate-100 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-teal-600" />
                <span>Contributions Stream</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search receipt, member..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading summary...</div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No contributions found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Target Fund</th>
                      <th className="py-3 px-4">Method</th>
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
                        <td className="py-3 px-4 capitalize text-slate-700">
                          {c.contribution_type?.replace(/_/g, ' ') || 'Savings'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {c.fund_name || 'General Savings'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 capitalize">
                          {c.payment_method?.replace(/_/g, ' ') || 'Cash'}
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
