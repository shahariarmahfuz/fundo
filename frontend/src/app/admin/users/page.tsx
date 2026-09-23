'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { User, PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { UserCog, UserPlus, AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff',
    phone: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<PaginatedResponse<User>>('/users?page=1&page_size=50');
      setUsers(res.items);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/users', form);
      setShowModal(false);
      setForm({ email: '', password: '', full_name: '', role: 'staff', phone: '' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader
        title="Administrative Staff & Role Permissions"
        subtitle="Manage operators, compliance officers, field supervisors, and portal access"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Role-Based Access Control (RBAC) System
          </div>

          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Staff User</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Full Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 pr-6 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No users registered.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-semibold text-slate-900">
                          {u.full_name}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {u.email}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={u.role === 'superadmin' ? 'info' : 'outline'}
                            className="text-[10px] uppercase font-mono"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {u.phone || '—'}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={u.is_active ? 'success' : 'destructive'}
                            className="text-[10px]"
                          >
                            {u.is_active ? 'ACTIVE' : 'DISABLED'}
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(u.created_at)}
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
              <h3 className="text-sm font-bold text-slate-900">Provision Staff Account</h3>
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
                <label className="text-[11px] font-medium text-slate-700">Full Name</label>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Salim Al-Nuaimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="salim@fundo.org"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Password</label>
                  <Input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="staff">Staff Operator</option>
                    <option value="admin">Administrator</option>
                    <option value="viewer">Auditor / Viewer</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
