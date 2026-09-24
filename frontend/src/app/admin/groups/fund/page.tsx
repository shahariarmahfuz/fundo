'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Group, GroupFundData } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import {
  Landmark,
  Search,
  ArrowLeft,
  PiggyBank,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  BookOpen,
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

function GroupFundContent() {
  const searchParams = useSearchParams();
  const { hasPermission, loading: authLoading, user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(searchParams.get('group_id') || '');
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [groupFundData, setGroupFundData] = useState<GroupFundData | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingFund, setLoadingFund] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Load groups
  useEffect(() => {
    async function loadGroups() {
      if (!hasPermission('groups.view')) {
        setLoadingGroups(false);
        return;
      }
      try {
        setLoadingGroups(true);
        const res = await ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100');
        const list = res.items || [];
        setGroups(list);

        if (!selectedGroupId && list.length > 0) {
          setSelectedGroupId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    }

    if (!authLoading) {
      loadGroups();
    }
  }, [authLoading, hasPermission]);

  // Load selected group's fund data
  useEffect(() => {
    async function fetchFundData() {
      if (!selectedGroupId || !hasPermission('groups.view')) {
        return;
      }
      try {
        setLoadingFund(true);
        const data = await ApiClient.get<GroupFundData>(
          `/contributions/group-fund/${selectedGroupId}?month=${selectedMonth}`
        );
        setGroupFundData(data);
      } catch (err) {
        console.error('Failed to load group fund data:', err);
      } finally {
        setLoadingFund(false);
      }
    }

    if (selectedGroupId && !authLoading) {
      fetchFundData();
    }
  }, [selectedGroupId, selectedMonth, authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('groups.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Group Funds"
          subtitle="Community savings pools and collective reserves"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="groups.view"
          message="You do not have authorization to view group funds."
        />
      </div>
    );
  }

  const months = getSelectableMonths();

  // Filter members in group
  const filteredMembers = (groupFundData?.members || []).filter((m) => {
    if (!memberSearch.trim()) return true;
    const term = memberSearch.toLowerCase();
    return (
      m.member_name.toLowerCase().includes(term) ||
      m.member_number.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
      <AdminHeader
        title="Group Fund & Member Allocation"
        subtitle="Track collective group funds, member monthly due reconciliation, and historical attribution"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/contributions"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Contributions</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Selector */}
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

            {/* Group Switcher Dropdown */}
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold h-8"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Group Header & Metric Cards */}
        {groupFundData && (
          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Landmark className="h-5 w-5 text-teal-700" />
                      <h2 className="text-lg font-bold text-slate-900">{groupFundData.group_name}</h2>
                      <Badge variant="outline" className="font-mono text-xs">
                        {groupFundData.group_code}
                      </Badge>
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 text-xs capitalize">
                        {groupFundData.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Region: {groupFundData.region || 'National'} • Meeting Frequency: {groupFundData.meeting_frequency}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/groups/ledger?group_id=${groupFundData.group_id}`}>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                        <BookOpen className="h-3.5 w-3.5 text-teal-700" />
                        <span>View Group Ledger</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 4 Financial Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Total Active Members</span>
                    <span className="text-xl font-bold text-slate-800 mt-1 block">
                      {groupFundData.total_members} Members
                    </span>
                    <span className="text-[11px] text-slate-400">Assigned to this Circle</span>
                  </div>

                  <div className="p-4 rounded-lg bg-teal-50/70 border border-teal-200">
                    <span className="text-xs text-teal-800 font-medium block">Total Lifetime Group Fund</span>
                    <span className="text-xl font-bold text-teal-800 mt-1 block">
                      {formatCurrency(groupFundData.total_contributions)}
                    </span>
                    <span className="text-[11px] text-teal-700/80">Cumulative member savings</span>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-medium block">Collected for {groupFundData.current_month}</span>
                    <span className="text-xl font-bold text-emerald-700 mt-1 block">
                      {formatCurrency(groupFundData.current_month_contributions)}
                    </span>
                    <span className="text-[11px] text-emerald-600/80">Month contributions</span>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-xs text-amber-800 font-medium block">Outstanding Member Due</span>
                    <span className={`text-xl font-bold mt-1 block ${groupFundData.outstanding_member_due > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {formatCurrency(groupFundData.outstanding_member_due)}
                    </span>
                    <span className="text-[11px] text-amber-700/80">
                      {groupFundData.outstanding_member_due > 0 ? 'Pending collection from members' : 'All members current'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Breakdown Table for this Group */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-700" />
                    <span>Member Contribution Performance ({groupFundData.members.length})</span>
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Accounting Month: <strong>{groupFundData.current_month}</strong>
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search group member..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingFund ? (
                  <div className="py-16 text-center text-xs text-slate-400">Loading group fund data...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    No members found in this group matching search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Expected Base</th>
                          <th className="py-3 px-4">Paid This Month</th>
                          <th className="py-3 px-4">Due This Month</th>
                          <th className="py-3 px-4">Lifetime Contributed</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredMembers.map((m) => (
                          <tr key={m.member_id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <Link
                                href={`/admin/members/ledger?member_id=${m.member_id}`}
                                className="font-semibold text-slate-900 hover:text-teal-700"
                              >
                                {m.member_name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {m.member_number}
                              </span>
                            </td>
                            <td className="py-3 px-4 capitalize">
                              <Badge variant="outline" className="text-[10px]">
                                {m.membership_status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {formatCurrency(m.current_month_expected)}
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-700">
                              {formatCurrency(m.current_month_paid)}
                            </td>
                            <td className="py-3 px-4">
                              {m.current_month_due > 0 ? (
                                <span className="font-bold text-amber-700">
                                  {formatCurrency(m.current_month_due)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">৳0.00</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-teal-800">
                              {formatCurrency(m.lifetime_contributed)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/admin/members/ledger?member_id=${m.member_id}`}>
                                  <Button size="sm" variant="ghost" className="text-[11px] h-7 px-2">
                                    Passbook
                                  </Button>
                                </Link>
                                {hasPermission('contributions.create') && (
                                  <Link
                                    href={`/admin/contributions/add?member_id=${m.member_id}&month=${groupFundData.current_month}`}
                                  >
                                    <Button
                                      size="sm"
                                      className={`text-[11px] h-7 px-2 ${
                                        m.current_month_due > 0
                                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                                      }`}
                                    >
                                      <span>{m.current_month_due > 0 ? 'Collect Due' : 'Add Deposit'}</span>
                                    </Button>
                                  </Link>
                                )}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupFundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading group fund data...</div>}>
      <GroupFundContent />
    </Suspense>
  );
}
