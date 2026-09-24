'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { UserPlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddBeneficiaryPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    beneficiary_code: `BEN-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: '',
    category: 'widow',
    assistance_type: 'financial',
    location: '',
    phone: '',
    notes: ''
  });

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('beneficiaries.create')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Add Beneficiary"
          subtitle="Register an aid recipient into the registry"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="beneficiaries.create"
          message="You do not have authorization to enroll new beneficiaries."
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
      await ApiClient.post('/beneficiaries', {
        beneficiary_code: form.beneficiary_code,
        full_name: form.full_name,
        category: form.category,
        assistance_type: form.assistance_type,
        location: form.location,
        phone: form.phone,
        notes: form.notes
      });
      setSuccessMsg(`Beneficiary ${form.full_name} (${form.beneficiary_code}) registered successfully.`);
      setTimeout(() => {
        router.push('/admin/beneficiaries');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register beneficiary. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Add Beneficiary"
        subtitle="Register verified recipient for humanitarian and community support"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/beneficiaries"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Beneficiary Directory</span>
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
              <UserPlus className="h-4 w-4 text-teal-700" />
              <CardTitle>Beneficiary Registration Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Beneficiary Code *</label>
                  <Input
                    required
                    value={form.beneficiary_code}
                    onChange={(e) => setForm({ ...form, beneficiary_code: e.target.value })}
                    className="font-mono"
                    placeholder="BEN-1001"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Full Name *</label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Fatima Al-Zahra"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Vulnerability Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="widow">Widow</option>
                    <option value="orphan">Orphan Support</option>
                    <option value="disabled">Special Needs / Disabled</option>
                    <option value="elderly">Elderly Household</option>
                    <option value="student">Student / Education Aid</option>
                    <option value="displaced">Displaced / Refugee</option>
                    <option value="poverty">Extreme Poverty</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Primary Assistance Type *</label>
                  <select
                    value={form.assistance_type}
                    onChange={(e) => setForm({ ...form, assistance_type: e.target.value })}
                    className="w-full text-xs h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="financial">Financial / Cash Assistance</option>
                    <option value="medical">Medical Treatment & Pharma</option>
                    <option value="educational">Educational Scholarship</option>
                    <option value="food">Nutritional / Food Relief</option>
                    <option value="emergency">Emergency Relief</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Phone Contact</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Location / Region</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="District / City"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Assessment & Verification Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Details of verification, household composition, or urgent requirements..."
                  className="w-full text-xs p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Link href="/admin/beneficiaries">
                  <Button type="button" variant="outline" className="text-xs">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting} className="text-xs">
                  {submitting ? 'Registering...' : 'Register Beneficiary'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
