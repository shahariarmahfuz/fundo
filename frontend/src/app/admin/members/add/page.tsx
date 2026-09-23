'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Group } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddMemberPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    member_number: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: '',
    national_id: '',
    phone: '',
    email: '',
    gender: 'female',
    group_id: '',
    membership_status: 'active'
  });

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100');
        setGroups(res.items);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }
    fetchGroups();
  }, []);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.create')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Add Member"
          subtitle="Register a new foundation community member"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          message="Your role does not have authorization to register new members."
          permission="members.create"
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

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
      setSuccessMsg(`Member ${form.full_name} (${form.member_number}) registered successfully.`);
      setTimeout(() => {
        router.push('/admin/members');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create member. Ensure member number is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Add Member"
        subtitle="Register a new community member into the foundation system"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Members</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className="min-w-0 w-full">
          <CardHeader className="p-4 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Member Enrollment Form</CardTitle>
                <p className="text-xs text-slate-500">Provide official identity and contact details for membership admission</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Member Number *
                  </label>
                  <Input
                    required
                    value={form.member_number}
                    onChange={(e) => setForm({ ...form, member_number: e.target.value })}
                    placeholder="MEM-0001"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Name *
                  </label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Fatima Al-Mansoor"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number *
                  </label>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+971-50-123-4567"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    National ID / SSN
                  </label>
                  <Input
                    value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                    placeholder="784-1990-1234567-1"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="fatima@example.org"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Assigned Self-Help Group
                  </label>
                  <select
                    value={form.group_id}
                    onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="">No Group (Unassigned)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Membership Status
                  </label>
                  <select
                    value={form.membership_status}
                    onChange={(e) => setForm({ ...form, membership_status: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="active">Active (Enrolled)</option>
                    <option value="pending">Pending Orientation</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/members')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white"
                >
                  {submitting ? 'Registering...' : 'Register Member'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
