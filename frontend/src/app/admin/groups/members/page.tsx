'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Group, Member } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Users, Search, ArrowLeft, Network } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function GroupMembersPage() {
  const [groups, setGroups] = useState<Group[]>([]);
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
        const [groupsRes, membersRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100'),
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=150')
        ]);
        setGroups(groupsRes.items || []);
        setMembers(membersRes.items || []);
      } catch (err) {
        console.error('Failed to load group members data:', err);
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
          title="Group Members"
          subtitle="Cluster membership and peer affiliation"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="groups.view"
          message="You do not have authorization to view group membership."
        />
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_number.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.toLowerCase().includes(search.toLowerCase()));
    const matchesGroup = selectedGroupId === 'all' || m.group_id === selectedGroupId;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Group Members"
        subtitle="Community members cataloged by savings circle clusters and mutual peer circles"
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

        {/* TABLE */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-700" />
                <CardTitle>Cluster Membership Directory</CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by member name, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="text-xs h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Groups ({groups.length})</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 pl-6">Member ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Assigned Group</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Join Date</th>
                    <th className="p-3 text-right pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Loading group members...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No members found for this group.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-6 font-mono text-[11px] font-semibold text-slate-900">
                          {m.member_number}
                        </td>
                        <td className="p-3 font-medium text-slate-900">{m.full_name}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <Network className="h-3 w-3 text-teal-700" />
                            {m.group_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">{m.phone || '—'}</td>
                        <td className="p-3 text-slate-500 text-[11px]">{formatDate(m.join_date)}</td>
                        <td className="p-3 text-right pr-6">
                          <Badge
                            variant={m.membership_status === 'active' ? 'success' : 'outline'}
                            className="text-[10px] capitalize font-mono"
                          >
                            {m.membership_status}
                          </Badge>
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
