'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Loan, Member, Group, MemberDuePreview } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CalendarClock,
  ArrowLeft,
  Users,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

function getSelectableMonths() {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value: val, label });
  }
  return months;
}

export default function MemberDueListPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'contributions' | 'loans'>('contributions');
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [search, setSearch] = useState('');

  // Contribution dues state
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberDues, setMemberDues] = useState<MemberDuePreview[]>([]);
  const [loadingDues, setLoadingDues] = useState(true);

  // Loans state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Load groups & members
  useEffect(() => {
    async function loadMembersAndGroups() {
      if (!hasPermission('members.view')) {
        setLoadingDues(false);
        return;
      }
      try {
        setLoadingDues(true);
        const [mRes, gRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=200'),
          ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100').catch(() => ({ items: [] }))
        ]);

        const mList = mRes.items || [];
        setMembers(mList);
        setGroups(gRes.items || []);

        // Query preview-due for each member for selectedMonth
        const duesPromises = mList.map((m) =>
          ApiClient.get<MemberDuePreview>(
            `/contributions/preview-due?member_id=${m.id}&month=${selectedMonth}`
          ).catch(() => null)
        );

        const results = await Promise.all(duesPromises);
        const validDues = results.filter((r): r is MemberDuePreview => r !== null);
        setMemberDues(validDues);
      } catch (err) {
        console.error('Failed to load member dues:', err);
      } finally {
        setLoadingDues(false);
      }
    }

    if (!authLoading && hasPermission('members.view')) {
      loadMembersAndGroups();
    }
  }, [authLoading, hasPermission, selectedMonth]);

  // Load loans if user switches to loan tab
  useEffect(() => {
    async function fetchLoans() {
      if (activeTab !== 'loans' || !hasPermission('loans.view')) return;
      try {
        setLoadingLoans(true);
        const res = await ApiClient.get<PaginatedResponse<Loan>>('/loans?page=1&page_size=100');
        const dueLoans = (res.items || []).filter((l) => Number(l.outstanding_balance) > 0);
        setLoans(dueLoans);
      } catch (err) {
        console.error('Failed to load loans:', err);
      } finally {
        setLoadingLoans(false);
      }
    }

    if (!authLoading && activeTab === 'loans') {
      fetchLoans();
    }
  }, [activeTab, authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Member Due List"
          subtitle="Monthly savings dues and scheduled repayments"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="members.view"
          message="Your role does not have authorization to view member dues."
        />
      </div>
    );
  }

  // Filter contribution dues
  const filteredDues = memberDues.filter((d) => {
    if (selectedGroup !== 'all' && d.group_id !== selectedGroup) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        d.member_name.toLowerCase().includes(term) ||
        d.member_number.toLowerCase().includes(term) ||
        (d.group_name && d.group_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const dueOnlyList = filteredDues.filter((d) => d.outstanding_due > 0);
  const totalOutstandingDueSum = filteredDues.reduce((sum, d) => sum + d.outstanding_due, 0);
  const totalPaidSum = filteredDues.reduce((sum, d) => sum + d.already_paid, 0);

  const months = getSelectableMonths();

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
      <AdminHeader
        title="Member Monthly Due List"
        subtitle="Track expected monthly base contributions, calculate outstanding dues, and collect payments"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation & Tab Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Contributions</span>
          </Link>

          {/* Tab Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'contributions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Contribution Dues
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'loans'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loan Installment Dues
            </button>
          </div>
        </div>

        {activeTab === 'contributions' ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Members with Pending Dues</p>
                      <h3 className="text-xl font-bold text-amber-600 mt-1">
                        {dueOnlyList.length} Members
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Out of {filteredDues.length} total active members
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Outstanding Month Dues</p>
                      <h3 className="text-xl font-bold text-rose-600 mt-1">
                        {formatCurrency(totalOutstandingDueSum)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Month: {selectedMonth}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Already Collected This Month</p>
                      <h3 className="text-xl font-bold text-emerald-600 mt-1">
                        {formatCurrency(totalPaidSum)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Allocated to member group funds
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search member by name or number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Month Picker */}
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 h-8 font-medium"
                    >
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} ({m.value}) {m.value === currentMonthStr ? '— Current' : ''}
                        </option>
                      ))}
                    </select>

                    {/* Group Filter */}
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 h-8"
                    >
                      <option value="all">All Groups</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Dues Table */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Monthly Member Due Schedule ({selectedMonth})
                </CardTitle>
                <span className="text-xs text-slate-400 font-mono">
                  max(Base - Paid, 0)
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {loadingDues ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    Computing monthly expected vs actual payments...
                  </div>
                ) : filteredDues.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    No members found matching selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Group</th>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4">Base Expected</th>
                          <th className="py-3 px-4">Paid So Far</th>
                          <th className="py-3 px-4">Outstanding Due</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredDues.map((d) => (
                          <tr key={d.member_id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/admin/members/ledger?member_id=${d.member_id}`}
                                className="font-semibold text-slate-900 hover:text-teal-700"
                              >
                                {d.member_name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {d.member_number}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {d.group_name ? (
                                <span className="font-medium text-slate-800">{d.group_name}</span>
                              ) : (
                                <span className="text-rose-500 font-medium">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <Badge variant="outline" className="text-[10px]">
                                {d.contribution_month}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {formatCurrency(d.base_contribution)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-700">
                              {formatCurrency(d.already_paid)}
                            </td>
                            <td className="py-3 px-4">
                              {d.outstanding_due > 0 ? (
                                <span className="font-bold text-amber-700">
                                  {formatCurrency(d.outstanding_due)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">৳0.00</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {d.already_paid === 0 ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                  Unpaid
                                </Badge>
                              ) : d.outstanding_due > 0 ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                  Partial Due
                                </Badge>
                              ) : d.already_paid > d.base_contribution ? (
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                  Surplus Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Fully Paid
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {hasPermission('contributions.create') && (
                                <Link
                                  href={`/admin/contributions/add?member_id=${d.member_id}&month=${d.contribution_month}`}
                                >
                                  <Button
                                    size="sm"
                                    className={`text-[11px] h-7 px-2.5 ${
                                      d.outstanding_due > 0
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>{d.outstanding_due > 0 ? 'Collect Due' : 'Add Deposit'}</span>
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Loans Tab */
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Active Micro-Finance Loan Repayments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLoans ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading loans...</div>
              ) : loans.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">No active loans with outstanding dues.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                        <th className="py-3 px-4">Loan #</th>
                        <th className="py-3 px-4">Borrower</th>
                        <th className="py-3 px-4">Principal</th>
                        <th className="py-3 px-4">Monthly Installment</th>
                        <th className="py-3 px-4">Outstanding Balance</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loans.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">{l.loan_number}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{l.member_name}</td>
                          <td className="py-3 px-4">{formatCurrency(l.principal_amount)}</td>
                          <td className="py-3 px-4 font-semibold text-amber-700">{formatCurrency(l.monthly_installment)}</td>
                          <td className="py-3 px-4 font-bold text-rose-600">{formatCurrency(l.outstanding_balance)}</td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/admin/loans`}>
                              <Button size="sm" variant="outline" className="text-[11px] h-7 px-2">
                                View Loan
                              </Button>
                            </Link>
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
      </div>
    </div>
  );
}
