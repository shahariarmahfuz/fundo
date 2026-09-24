'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { SadaqaReport, Fund } from '@/types/admin';
import { formatCurrency } from '@/lib/utils';
import {
  HandHeart,
  ArrowLeft,
  Printer,
  Calendar,
  Filter,
  Users,
  Building,
  TrendingUp,
  Award,
  Wallet,
  PieChart,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function SadaqaReportsPage() {
  const { hasPermission, loading: authLoading, user, isSuperAdmin } = useAuth();
  const [report, setReport] = useState<SadaqaReport | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFund, setSelectedFund] = useState('');
  const [activeTab, setActiveTab] = useState<'funds' | 'monthly' | 'donors'>('funds');

  const canAccessReports = isSuperAdmin || hasPermission('sadaqa.reports');

  const loadFunds = async () => {
    try {
      const res = await ApiClient.get<Fund[]>('/finance/funds?active_only=true');
      setFunds(res || []);
    } catch (err) {
      console.error('Failed to load funds:', err);
    }
  };

  const loadReport = async () => {
    if (!canAccessReports) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedFund && selectedFund !== 'all') params.append('fund_id', selectedFund);

      const res = await ApiClient.get<SadaqaReport>(`/sadaqa/reports?${params.toString()}`);
      setReport(res);
    } catch (err) {
      console.error('Failed to load Sadaqa report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadReport();
    }
  }, [authLoading, hasPermission, isSuperAdmin, startDate, endDate, selectedFund]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const applyPreset = (preset: 'all' | 'this_month' | 'this_year') => {
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!canAccessReports) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Sadaqa Report"
          subtitle="Charitable giving analytics"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="sadaqa.reports"
          message="You do not have authorization to view Sadaqa financial reports."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Sadaqa Report"
        subtitle="Analytical summaries of charitable donations, fund inflows, and donor trends"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/sadaqa"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Registry</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 gap-1.5 text-xs text-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Report</span>
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <form onSubmit={handleFilterSubmit} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-teal-700" />
                  <span>Report Date Range & Fund Filter</span>
                </span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('this_month')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('this_year')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    This Year
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Specific Fund</label>
                  <select
                    value={selectedFund}
                    onChange={(e) => setSelectedFund(e.target.value)}
                    className="w-full h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="">All Funds</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading Sadaqa analytics...</div>
        ) : !report ? (
          <div className="py-16 text-center text-xs text-slate-400">No report data available.</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">Total Sadaqa Received</span>
                    <HandHeart className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-2">
                    {formatCurrency(report.total_amount_received)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <span>Irrevocable donor gifts</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">Donations Recorded</span>
                    <Award className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-2">
                    {report.total_donations_count}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Completed receipt transactions
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">Average Donation Size</span>
                    <TrendingUp className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-2">
                    {formatCurrency(report.average_donation_amount)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Mean contribution volume
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-medium">This Month&apos;s Inflow</span>
                    <Calendar className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-2">
                    {formatCurrency(report.this_month_amount)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Current calendar month total
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sub-Reports Tabs */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('funds')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'funds'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Fund-Wise Summary ({report.fund_breakdown.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('monthly')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'monthly'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Monthly Summary ({report.monthly_breakdown.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('donors')}
                  className={`pb-2.5 border-b-2 transition-colors ${
                    activeTab === 'donors'
                      ? 'border-teal-700 text-teal-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Donor-Wise Summary
                </button>
              </div>

              {/* Tab 1: Fund-Wise Breakdown */}
              {activeTab === 'funds' && (
                <Card className="border border-slate-200 bg-white shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-semibold text-slate-800">
                      Distribution by Capital Fund
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {report.fund_breakdown.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No fund breakdown available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Fund Name</th>
                              <th className="py-3 px-4">Code</th>
                              <th className="py-3 px-4 text-center">Gifts Count</th>
                              <th className="py-3 px-4 text-right">Total Received</th>
                              <th className="py-3 px-4 text-right">% Contribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {report.fund_breakdown.map((fb) => (
                              <tr key={fb.fund_id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {fb.fund_name}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500">{fb.fund_code}</td>
                                <td className="py-3 px-4 text-center font-medium">{fb.count}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                  {formatCurrency(fb.total_amount)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-medium text-slate-700">{fb.percentage}%</span>
                                    <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-teal-700 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, fb.percentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 2: Monthly Summary */}
              {activeTab === 'monthly' && (
                <Card className="border border-slate-200 bg-white shadow-xs">
                  <CardHeader className="py-3 px-4 border-b border-slate-100">
                    <CardTitle className="text-xs font-semibold text-slate-800">
                      Monthly Sadaqa Inflow (Last 12 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {report.monthly_breakdown.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No monthly summary available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">Calendar Month</th>
                              <th className="py-3 px-4 text-center">Gifts Recorded</th>
                              <th className="py-3 px-4 text-right">Monthly Volume</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {report.monthly_breakdown.map((mb) => (
                              <tr key={mb.month} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                                  {mb.month}
                                </td>
                                <td className="py-3 px-4 text-center font-medium">{mb.count}</td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                  {formatCurrency(mb.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 3: Donor-Wise Summary */}
              {activeTab === 'donors' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Donor Type Breakdown */}
                  <Card className="border border-slate-200 bg-white shadow-xs lg:col-span-1">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-xs font-semibold text-slate-800">
                        Inflow by Donor Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs">
                      {report.donor_type_breakdown.map((db) => {
                        const label =
                          db.donor_type === 'member'
                            ? 'Foundation Members'
                            : db.donor_type === 'beneficiary'
                            ? 'Beneficiaries'
                            : 'External / Guests';
                        return (
                          <div
                            key={db.donor_type}
                            className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>{label}</span>
                              <span className="text-emerald-700">{formatCurrency(db.total_amount)}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {db.count} {db.count === 1 ? 'gift recorded' : 'gifts recorded'}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Top Donors */}
                  <Card className="border border-slate-200 bg-white shadow-xs lg:col-span-2">
                    <CardHeader className="py-3 px-4 border-b border-slate-100">
                      <CardTitle className="text-xs font-semibold text-slate-800">
                        Top Contributing Donors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {report.top_donors.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No named donor contributions recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-3 px-4">Donor Name</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4 text-center">Gifts</th>
                                <th className="py-3 px-4 text-right">Total Gifted</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {report.top_donors.map((td, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {td.donor_name}
                                  </td>
                                  <td className="py-3 px-4 capitalize text-slate-500">
                                    {td.donor_type}
                                  </td>
                                  <td className="py-3 px-4 text-center font-medium">{td.count}</td>
                                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                    {formatCurrency(td.total_amount)}
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
