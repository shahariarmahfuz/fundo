'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Member } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Users, Search, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { hasPermission, loading: authLoading, user } = useAuth();

  const loadMembers = async () => {
    if (!hasPermission('members.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ApiClient.get<PaginatedResponse<Member>>(
        `/members?page=1&page_size=50${search ? `&search=${encodeURIComponent(search)}` : ''}`
      );
      setMembers(res.items);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('members.view')) {
      loadMembers();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMembers();
  };

  if (!authLoading && !hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Member Directory"
          subtitle="Registered participants and mutual savings community"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="members.view"
          message="You do not have authorization to view the members directory."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Member Directory"
        subtitle="Manage registered foundation community members and circle affiliations"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        {/* ACTION & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Filter
            </Button>
          </form>

          {hasPermission('members.create') && (
            <Link href="/admin/members/add">
              <Button size="sm" className="gap-1.5 shrink-0 bg-teal-700 hover:bg-teal-800 text-white">
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
              </Button>
            </Link>
          )}
        </div>

        {/* MEMBERS TABLE */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Member #</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Group / Circle</th>
                    <th className="p-3">National ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-6 text-right">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading member directory...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No members found matching query.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-6 font-mono font-medium text-teal-800">
                          {m.member_number}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {m.photo_url ? (
                              <img
                                src={m.photo_url}
                                alt={m.full_name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200">
                                {m.full_name?.charAt(0)?.toUpperCase() || 'M'}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{m.full_name}</div>
                              {m.occupation && (
                                <div className="text-[10px] text-slate-400">{m.occupation}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          {m.phone || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="p-3 text-slate-600">
                          {m.group_name ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-100">
                              {m.group_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 font-mono">
                          {m.national_id || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={m.membership_status === 'active' ? 'success' : 'default'}
                            className="text-[10px] uppercase"
                          >
                            {m.membership_status}
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(m.join_date)}
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

