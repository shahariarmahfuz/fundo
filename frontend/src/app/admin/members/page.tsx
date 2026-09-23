'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Member, Group } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Users, Search, Plus, UserPlus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { hasPermission, loading: authLoading, user } = useAuth();

  const [form, setForm] = useState({
    member_number: '',
    full_name: '',
    national_id: '',
    phone: '',
    email: '',
    gender: 'female',
    group_id: '',
    membership_status: 'active'
  });

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

  const loadGroups = async () => {
    try {
      const res = await ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=50');
      setGroups(res.items);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('members.view')) {
      loadMembers();
      loadGroups();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMembers();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      const payload: any = {
        member_number: form.member_number,
        full_name: form.full_name,
        phone: form.phone,
        gender: form.gender,
        membership_status: form.membership_status
      };
      if (form.national_id) payload.national_id = form.national_id;
      if (form.email) payload.email = form.email;
      if (form.group_id) payload.group_id = form.group_id;

      await ApiClient.post('/members', payload);
      setShowModal(false);
      setForm({
        member_number: '',
        full_name: '',
        national_id: '',
        phone: '',
        email: '',
        gender: 'female',
        group_id: '',
        membership_status: 'active'
      });
      loadMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register member');
    } finally {
      setModalLoading(false);
    }
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
            <Button
              onClick={() => {
                setForm({
                  ...form,
                  member_number: `MBR-${Math.floor(1000 + Math.random() * 9000)}`
                });
                setShowModal(true);
              }}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enroll Member</span>
            </Button>
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
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {m.member_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {m.full_name}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {m.phone}
                        </td>
                        <td className="p-3 text-slate-600">
                          {m.group_name ? (
                            <span className="font-medium text-teal-800">{m.group_name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] font-mono text-slate-500">
                          {m.national_id || '—'}
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

      {/* ENROLL MEMBER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Enroll New Community Member</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Member #</label>
                  <Input
                    required
                    value={form.member_number}
                    onChange={(e) => setForm({ ...form, member_number: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Full Name</label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Bilal Ahmed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Phone</label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">National ID (Optional)</label>
                  <Input
                    value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                    placeholder="NAT-XXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Savings Circle Group</label>
                  <select
                    value={form.group_id}
                    onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="">No Group Assigned</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Registering...' : 'Save Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
