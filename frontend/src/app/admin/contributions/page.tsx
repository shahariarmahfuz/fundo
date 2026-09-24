'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Contribution, Group } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PiggyBank,
  Plus,
  Search,
  Users,
  Calendar,
  BookOpen,
  CalendarClock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminContributionsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [page, setPage] = useState(1);

  const loadData = async () => {
    if (!hasPermission('contributions.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let url = `/contributions?page=${page}&page_size=50`;
      if (selectedGroup !== 'all') {
        url += `&group_id=${selectedGroup}`;
      }
      if (selectedMonth !== 'all') {
        url += `&contribution_month=${selectedMonth}`;
      }
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const [resC, resG] = await Promise.all([
        ApiClient.get<PaginatedResponse<Contribution>>(url),
        ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100').catch(() => ({ items: [] }))
      ]);

      setContributions(resC.items || []);
      setTotalCount(resC.total || 0);
      setGroups(resG.items || []);
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('contributions.view')) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission, page, selectedGroup, selectedMonth]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying authorization...</div>
      </div>
    );
  }

  if (!hasPermission('contributions.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Contributions Management"
          subtitle="Member savings passbooks and group fund collections"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="contributions.view"
          message="You do not have permission to view member contributions."
        />
      </div>
    );
  }

  // Summary figures
  const totalAmountSum = contributions.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthSum = contributions
    .filter((c) => c.contribution_month === currentMonthStr)
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);

  // Extract unique contribution months for filter
  const uniqueMonths = Array.from(new Set(contributions.map((c) => c.contribution_month).filter(Boolean))).sort().reverse();

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
      <AdminHeader
        title="Member Contributions & Savings"
        subtitle="Individual passbook entries, group fund accounting, and monthly due tracking"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/groups/fund">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <Users className="h-3.5 w-3.5 text-teal-700" />
                <span>Group Funds</span>
              </Button>
            </Link>
            <Link href="/admin/members/ledger">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <BookOpen className="h-3.5 w-3.5 text-teal-700" />
                <span>Member Ledgers</span>
              </Button>
            </Link>
            <Link href="/admin/members/due-list">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                <span>Monthly Due List</span>
              </Button>
            </Link>
          </div>

          {hasPermission('contributions.create') && (
            <Link href="/admin/contributions/add">
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs h-8">
                <Plus className="h-3.5 w-3.5" />
                <span>Record Contribution</span>
              </Button>
            </Link>
          )}
        </div>

        {/* High-Level Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Filtered Total Collected</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalAmountSum)}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{totalCount} total transactions recorded</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                  <PiggyBank className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Current Month Collections</p>
                  <h3 className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(currentMonthSum)}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Month: {currentMonthStr}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Active Groups Contributing</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{groups.length} Circles</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Group fund allocation enforced</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search by receipt #, member name, payment reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Group Filter */}
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 h-8"
                >
                  <option value="all">All Groups</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                {/* Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 h-8"
                >
                  <option value="all">All Months</option>
                  {uniqueMonths.map((m) => (
                    <option key={m} value={m}>
                      Month: {m}
                    </option>
                  ))}
                </select>

                <Button type="submit" size="sm" variant="outline" className="text-xs h-8 gap-1">
                  <Filter className="h-3 w-3" />
                  <span>Filter</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contributions Ledger Table */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Contribution Transactions ({totalCount})
            </CardTitle>
            <span className="text-xs text-slate-400 font-mono">Immutable Passbook Ledger</span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading contributions records...</div>
            ) : contributions.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <PiggyBank className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No contribution records found.</p>
                <p className="text-[11px] text-slate-400">Try adjusting your filters or record a new member deposit.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Group Allocation</th>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {contributions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {c.receipt_number}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/members/ledger?member_id=${c.member_id}`}
                            className="font-medium text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1"
                          >
                            <span>{c.member_name || 'Member'}</span>
                            <ArrowUpRight className="h-3 w-3 text-slate-400" />
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {c.member_number || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {c.group_name ? (
                            <Link
                              href={`/admin/groups/fund?group_id=${c.group_id}`}
                              className="inline-flex items-center gap-1 text-slate-800 hover:text-teal-700"
                            >
                              <Users className="h-3 w-3 text-teal-700" />
                              <span className="font-medium">{c.group_name}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {c.contribution_month}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize">{c.payment_method?.replace('_', ' ')}</span>
                          {c.payment_reference && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Ref: {c.payment_reference}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(c.contribution_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {c.recorded_by || 'System'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/members/ledger?member_id=${c.member_id}`}
                            className="text-teal-700 hover:text-teal-800 text-[11px] font-medium"
                          >
                            Passbook
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
      </div>
    </div>
  );
}
