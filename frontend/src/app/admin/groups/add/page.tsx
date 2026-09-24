'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Network, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddGroupPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    code: `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    region: '',
    meeting_frequency: 'monthly',
    description: '',
    status: 'active'
  });

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('groups.create')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Add Group"
          subtitle="Form a new community savings circle"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="groups.create"
          message="You do not have authorization to form or add new groups."
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
      await ApiClient.post('/groups', form);
      setSuccessMsg(`Group "${form.name}" (${form.code}) registered successfully.`);
      setTimeout(() => {
        router.push('/admin/groups');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create group. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Add Group"
        subtitle="Establish a new mutual accountability cluster and community savings circle"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/groups"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Groups Directory</span>
          </Link>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="font-medium">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800 text-xs animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-teal-700" />
              <CardTitle>Savings Circle Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Group Code *</label>
                  <Input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="font-mono"
                    placeholder="GRP-1001"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Group Name *</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Al-Barakah Mutual Cluster"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Region / District *</label>
                  <Input
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="e.g. Northern Sector / Zone A"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Meeting Frequency</label>
                  <select
                    value={form.meeting_frequency}
                    onChange={(e) => setForm({ ...form, meeting_frequency: e.target.value })}
                    className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="weekly">Weekly Cadence</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly Session</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Cluster Mission & Rules</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline purpose, eligibility requirements, and meeting venue..."
                  className="w-full text-xs p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Link href="/admin/groups">
                  <Button type="button" variant="outline" className="text-xs">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting} className="text-xs">
                  {submitting ? 'Registering...' : 'Register Group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
