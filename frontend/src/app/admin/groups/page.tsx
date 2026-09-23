'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Group } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Network, Plus, Users, Search, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminGroupsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    region: '',
    meeting_frequency: 'monthly',
    description: '',
    status: 'active'
  });

  const loadData = async () => {
    if (!hasPermission('groups.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let url = `/groups?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await ApiClient.get<PaginatedResponse<Group>>(url);
      setGroups(res.items);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('groups.view')) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/groups', form);
      setShowModal(false);
      setForm({ code: '', name: '', region: '', meeting_frequency: 'monthly', description: '', status: 'active' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create group');
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !hasPermission('groups.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Community Savings Circles & Groups"
          subtitle="Grassroots clusters and mutual accountability groups"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="groups.view"
          message="You do not have authorization to view the groups and savings circles."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Community Savings Circles & Groups"
        subtitle="Manage grassroots clusters, mutual accountability groups, and meeting cadences"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <form onSubmit={(e) => { e.preventDefault(); loadData(); }} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search groups by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </form>

          {hasPermission('groups.create') && (
            <Button
              onClick={() => {
                setForm({
                  ...form,
                  code: `GRP-${Math.floor(100 + Math.random() * 900)}`
                });
                setShowModal(true);
              }}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Form New Circle</span>
            </Button>
          )}
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Group Code</th>
                    <th className="p-3">Circle Name</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Cadence</th>
                    <th className="p-3">Active Members</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-6 text-right">Established</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading community circles...
                      </td>
                    </tr>
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No groups found.
                      </td>
                    </tr>
                  ) : (
                    groups.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-medium text-slate-900">
                          {g.code}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {g.name}
                        </td>
                        <td className="p-3 text-slate-600">
                          {g.region || '—'}
                        </td>
                        <td className="p-3 capitalize text-slate-600">
                          {g.meeting_frequency}
                        </td>
                        <td className="p-3 text-slate-900 font-semibold">
                          {g.member_count || 0} members
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={g.status === 'active' ? 'success' : 'default'}
                            className="text-[10px] uppercase"
                          >
                            {g.status}
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(g.created_at)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Form New Savings Circle</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Group Code</label>
                <Input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Group / Circle Name</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Al-Barakah Mutual Cluster"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Region</label>
                  <Input
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="e.g. Western Valley"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Meeting Frequency</label>
                  <select
                    value={form.meeting_frequency}
                    onChange={(e) => setForm({ ...form, meeting_frequency: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Form Circle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
