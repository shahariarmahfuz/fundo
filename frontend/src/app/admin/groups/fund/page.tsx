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
import { formatCurrency } from '@/lib/utils';
import { Landmark, Search, ArrowLeft, PiggyBank, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function GroupFundPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
        console.error('Failed to load group fund data:', err);
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

  // Create member ID to Group mapping
  const memberGroupMap = new Map<string, string>();
  members.forEach((m) => {
    if (m.group_id) {
      memberGroupMap.set(m.id, m.group_id);
    }
  });

  // Calculate funds per group
  const groupFundData = groups.map((g) => {
    const groupContributions = contributions.filter((c) => {
      const gid = (c as any).group_id || memberGroupMap.get(c.member_id);
      return gid === g.id;
    });
    const totalCollected = groupContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    return {
      ...g,
      total_collected: totalCollected,
      contribution_count: groupContributions.length
    };
  });

  const filteredGroups = groupFundData.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.code.toLowerCase().includes(search.toLowerCase()) ||
    (g.region && g.region.toLowerCase().includes(search.toLowerCase()))
  );

  const grandTotal = filteredGroups.reduce((sum, g) => sum + g.total_collected, 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Group Funds"
        subtitle="Monitored mutual capital pools and collective savings reserves"
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
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Active Savings Circles</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{filteredGroups.length}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Grassroots clusters</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Total Group Capital</div>
              <div className="text-xl font-bold text-teal-700 mt-1">
                {formatCurrency(grandTotal)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pooled member savings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Average Pool Balance</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(filteredGroups.length > 0 ? grandTotal / filteredGroups.length : 0)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per community cluster</div>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-teal-700" />
                <CardTitle>Group Capital & Reserve Breakdown</CardTitle>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Filter by group code, name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 pl-6">Code</th>
                    <th className="p-3">Group Name</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Members</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-6">Accumulated Fund Pool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading group fund balances...
                      </td>
                    </tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No groups found.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-6 font-mono text-[11px] font-semibold text-slate-900">
                          {g.code}
                        </td>
                        <td className="p-3 font-medium text-slate-900">{g.name}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{g.region || '—'}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <Users className="h-3 w-3 text-slate-400" />
                            {g.member_count}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 capitalize text-[11px]">{g.meeting_frequency}</td>
                        <td className="p-3">
                          <Badge
                            variant={g.status === 'active' ? 'success' : 'outline'}
                            className="text-[10px] capitalize font-mono"
                          >
                            {g.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right pr-6 font-bold text-slate-900 font-mono text-xs">
                          {formatCurrency(g.total_collected)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
