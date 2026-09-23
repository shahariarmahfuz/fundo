'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { User, PaginatedResponse, Role, Permission } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { UserCog, UserPlus, AlertCircle, X, ShieldCheck, Plus, Check, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminUsersPage() {
  const { hasPermission, loading: authLoading, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [userErrorMsg, setUserErrorMsg] = useState('');

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff',
    phone: ''
  });

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [roleErrorMsg, setRoleErrorMsg] = useState('');

  const [roleForm, setRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_codes: [] as string[]
  });

  const loadUsers = async () => {
    if (!hasPermission('users.view')) {
      setLoadingUsers(false);
      return;
    }
    try {
      setLoadingUsers(true);
      const res = await ApiClient.get<PaginatedResponse<User>>('/users?page=1&page_size=50');
      setUsers(res.items);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRolesAndPermissions = async () => {
    try {
      setLoadingRoles(true);
      const [rolesRes, permsRes] = await Promise.all([
        ApiClient.get<Role[]>('/roles'),
        ApiClient.get<Permission[]>('/permissions')
      ]);
      setRoles(rolesRes);
      setPermissions(permsRes);
    } catch (err) {
      console.error('Failed to load roles/permissions:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('users.view')) {
      loadUsers();
      loadRolesAndPermissions();
    } else if (!authLoading) {
      setLoadingUsers(false);
    }
  }, [authLoading, hasPermission]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalLoading(true);
    setUserErrorMsg('');
    try {
      await ApiClient.post('/users', userForm);
      setShowUserModal(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'staff', phone: '' });
      loadUsers();
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Failed to create user');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleModalLoading(true);
    setRoleErrorMsg('');
    try {
      await ApiClient.post('/roles', roleForm);
      setShowRoleModal(false);
      setRoleForm({ name: '', display_name: '', description: '', permission_codes: [] });
      loadRolesAndPermissions();
    } catch (err: any) {
      setRoleErrorMsg(err.message || 'Failed to create role');
    } finally {
      setRoleModalLoading(false);
    }
  };

  const togglePermissionSelection = (code: string) => {
    setRoleForm((prev) => {
      const exists = prev.permission_codes.includes(code);
      return {
        ...prev,
        permission_codes: exists
          ? prev.permission_codes.filter((c) => c !== code)
          : [...prev.permission_codes, code]
      };
    });
  };

  if (!authLoading && !hasPermission('users.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Users & Role Management"
          subtitle="Access control, user accounts, and permissions"
          userRole={currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="users.view"
          message="You do not have authorization to view the user management module."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Administrative Staff & Role-Based Access Control"
        subtitle="Manage user accounts, granular permissions, and custom role assignments"
        userRole={currentUser?.role ? currentUser.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        {/* TAB NAVIGATION & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Staff Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'roles'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Roles & Granular Permissions ({roles.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'users' && hasPermission('users.create') && (
              <Button
                onClick={() => setShowUserModal(true)}
                size="sm"
                className="gap-1.5 shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Staff User</span>
              </Button>
            )}

            {activeTab === 'roles' && hasPermission('roles.create') && (
              <Button
                onClick={() => setShowRoleModal(true)}
                size="sm"
                className="gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Create Custom Role</span>
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <Card className="min-w-0 w-full overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3 pl-6">Full Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Granted Permissions</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-6 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loadingUsers ? (
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
                              variant={u.is_superadmin ? 'info' : 'outline'}
                              className="text-[10px] uppercase font-mono"
                            >
                              {u.role.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">
                            {u.is_superadmin ? (
                              <span className="text-teal-700 font-semibold">ALL (Super Admin Bypass)</span>
                            ) : u.permissions && u.permissions.length > 0 ? (
                              <span className="font-mono text-slate-600">
                                {u.permissions.length} permissions ({u.permissions.slice(0, 2).join(', ')}{u.permissions.length > 2 ? '...' : ''})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None assigned</span>
                            )}
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
        )}

        {/* TAB 2: ROLES & GRANULAR PERMISSIONS */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => (
                <Card key={r.id} className="flex flex-col justify-between p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">{r.display_name}</div>
                      <Badge variant={r.is_system ? 'default' : 'outline'} className="text-[10px]">
                        {r.is_system ? 'System Role' : 'Custom Role'}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">Role ID: {r.name}</div>
                    {r.description && (
                      <p className="text-xs text-slate-600">{r.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Granted Permissions ({r.permissions?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {r.name === 'super_admin' ? (
                        <Badge variant="info" className="text-[10px]">
                          All 39 System Permissions (Root)
                        </Badge>
                      ) : r.permissions && r.permissions.length > 0 ? (
                        r.permissions.map((p) => (
                          <Badge key={p.code} variant="outline" className="text-[10px] font-mono">
                            {p.code}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {userErrorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Full Name</label>
                <Input
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="e.g. Salim Al-Nuaimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="salim@fundo.org"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Password</label>
                  <Input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Assigned Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.display_name} ({r.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Phone</label>
                  <Input
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={userModalLoading}>
                  {userModalLoading ? 'Creating...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create Custom Security Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {roleErrorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{roleErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Role Identifier</label>
                  <Input
                    required
                    placeholder="e.g. loan_officer"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  />
                  <span className="text-[10px] text-slate-400">Lowercase letters and underscores</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Display Name</label>
                  <Input
                    required
                    placeholder="e.g. Loan Officer"
                    value={roleForm.display_name}
                    onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Description</label>
                <Input
                  placeholder="Describes operational scope of this role"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-800">
                    Assign Permissions ({roleForm.permission_codes.length} selected)
                  </label>
                  <span className="text-[10px] text-teal-700 font-medium">Granular RBAC</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-md p-3 max-h-56 overflow-y-auto bg-slate-50/50">
                  {permissions.map((p) => {
                    const isSelected = roleForm.permission_codes.includes(p.code);
                    return (
                      <div
                        key={p.code}
                        onClick={() => togglePermissionSelection(p.code)}
                        className={`p-2 rounded border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-mono text-[11px] truncate">{p.code}</div>
                          <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-teal-700 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={roleModalLoading}>
                  {roleModalLoading ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
