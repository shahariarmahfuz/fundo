'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Group, Contribution, Member } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, BookOpen, ArrowLeft, Network, Wallet, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function GroupLedgerPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission, loading: authLoading, user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!hasPermission('groups.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [groupsRes, contribRes, membersRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100'),
          ApiClient.get<PaginatedResponse<Contribution>>('/contributions?page=1&page_size=200'),
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=200')
        ]);
        setGroups(groupsRes.items || []);
        setContributions(contribRes.items || []);
        setMembers(membersRes.items || []);
      } catch (err) {
        console.error('Failed to load group ledger data:', err);
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

  if (!hasPermission('groups.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Group Ledger"
          subtitle="Group savings contributions, accounting records, and audit journal"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="groups.view"
          message="You do not have authorization to view the group ledger."
        />
      </div>
    );
  }

  // Create member ID to Group mapping
  const memberGroupMap = new Map<string, Group>();
  members.forEach((m) => {
    if (m.group_id) {
      const g = groups.find((grp) => grp.id === m.group_id);
      if (g) {
        memberGroupMap.set(m.id, g);
      }
    }
  });

  // Enrich contributions with historical group allocation
  const enrichedContributions = contributions.map((c) => {
    const historicalGroup = c.group_id ? groups.find((g) => g.id === c.group_id) : null;
    const currentMemberGroup = memberGroupMap.get(c.member_id);
    const assignedGroup = historicalGroup || currentMemberGroup;
    return {
      ...c,
      group_name: c.group_name || assignedGroup?.name || 'Unassigned / Individual',
      group_code: c.group_code || assignedGroup?.code || '—',
      group_id: c.group_id || assignedGroup?.id || null
    };
  });

  const filteredContributions = enrichedContributions.filter((c) => {
    const matchesSearch =
      (c.receipt_number && c.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
      (c.member_name && c.member_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.group_name && c.group_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.group_code && c.group_code.toLowerCase().includes(search.toLowerCase())) ||
      (c.fund_name && c.fund_name.toLowerCase().includes(search.toLowerCase()));

    const matchesGroup =
      selectedGroupId === 'all' ||
      (selectedGroupId === 'unassigned' ? !c.group_id : c.group_id === selectedGroupId);

    return matchesSearch && matchesGroup;
  });

  const totalLedgerAmount = filteredContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const completedEntries = filteredContributions.filter((c) => c.status === 'completed' || c.status === 'paid').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Group Ledger"
        subtitle="Group savings contributions, accounting records, and audit journal"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/groups"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Groups</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/groups/fund"
              className="text-xs font-medium text-teal-700 hover:underline"
            >
              View Group Fund Pool →
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Ledger Volume</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(totalLedgerAmount)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Across {filteredContributions.length} records</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Groups</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{groups.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Community collectives</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                <Network className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Verified Transactions</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{completedEntries}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Settled contributions</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Group Members</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {groups.reduce((sum, g) => sum + (g.member_count || 0), 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Enrolled participants</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border border-slate-100 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-600" />
                <span>Group Ledger Entries</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search receipt, member, group..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Groups</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                  <option value="unassigned">Unassigned / Direct</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Loading ledger entries...
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No ledger entries found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4">Member</th>
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
                          <div className="font-medium text-slate-800">{c.group_name}</div>
                          {c.group_code !== '—' && (
                            <div className="text-[10px] text-slate-400 font-mono">{c.group_code}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800">{c.member_name || 'Anonymous / Walk-in'}</div>
                          {c.member_number && (
                            <div className="text-[10px] text-slate-400 font-mono">{c.member_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {c.fund_name || 'General Savings'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 capitalize">
                          {c.payment_method?.replace('_', ' ') || 'Cash'}
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
