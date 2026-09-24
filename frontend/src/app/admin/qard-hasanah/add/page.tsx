'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Member, Group, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { Coins, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddQardHasanahPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    borrower_id: '',
    group_id: '',
    fund_id: '',
    principal_amount: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    repayment_start_date: '',
    repayment_schedule: 'monthly',
    installment_count: '12',
    installment_amount: '',
    purpose: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    async function loadFormData() {
      if (!hasPermission('qard_hasanah.create')) {
        setLoadingData(false);
        return;
      }
      try {
        setLoadingData(true);
        const [memRes, grpRes, fundRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=150').catch(() => ({ items: [] })),
          ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);

        const memList = (memRes as PaginatedResponse<Member>).items || [];
        const grpList = (grpRes as PaginatedResponse<Group>).items || [];
        const fundList = (fundRes as Fund[]) || [];

        setMembers(memList);
        setGroups(grpList);
        setFunds(fundList);

        if (memList.length > 0 && !form.borrower_id) {
          setForm((prev) => ({
            ...prev,
            borrower_id: memList[0].id,
            group_id: memList[0].group_id || ''
          }));
        }
        if (fundList.length > 0 && !form.fund_id) {
          setForm((prev) => ({ ...prev, fund_id: fundList[0].id }));
        }
      } catch (err) {
        console.error('Failed to load form dependencies:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading) {
      loadFormData();
    }
  }, [authLoading, hasPermission]);

  // Auto-calculate installment amount whenever principal or count changes
  const handlePrincipalOrCountChange = (principal: string, count: string) => {
    const p = parseFloat(principal);
    const c = parseInt(count, 10);
    if (!isNaN(p) && p > 0 && !isNaN(c) && c > 0) {
      setForm((prev) => ({
        ...prev,
        principal_amount: principal,
        installment_count: count,
        installment_amount: (p / c).toFixed(2)
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        principal_amount: principal,
        installment_count: count
      }));
    }
  };

  const handleMemberChange = (memberId: string) => {
    const m = members.find((item) => item.id === memberId);
    setForm((prev) => ({
      ...prev,
      borrower_id: memberId,
      group_id: m?.group_id || ''
    }));
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('qard_hasanah.create')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Add Qard Hasanah"
          subtitle="Interest-free benevolent loan disbursement"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="qard_hasanah.create"
          message="You do not have authorization to issue new Qard Hasanah loans."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.borrower_id) {
      setErrorMsg('Please select a borrower member.');
      setSubmitting(false);
      return;
    }

    if (!form.fund_id) {
      setErrorMsg('Please select a capital disbursement fund.');
      setSubmitting(false);
      return;
    }

    const principal = parseFloat(form.principal_amount);
    if (isNaN(principal) || principal <= 0) {
      setErrorMsg('Please enter a valid positive principal amount.');
      setSubmitting(false);
      return;
    }

    const instCount = parseInt(form.installment_count, 10);
    if (isNaN(instCount) || instCount < 1) {
      setErrorMsg('Number of installments must be at least 1.');
      setSubmitting(false);
      return;
    }

    try {
      await ApiClient.post('/qard-hasanah', {
        borrower_id: form.borrower_id,
        group_id: form.group_id || undefined,
        fund_id: form.fund_id,
        principal_amount: principal,
        disbursement_date: form.disbursement_date || undefined,
        repayment_start_date: form.repayment_start_date || undefined,
        repayment_schedule: form.repayment_schedule,
        installment_count: instCount,
        installment_amount: form.installment_amount ? parseFloat(form.installment_amount) : undefined,
        purpose: form.purpose || undefined,
        notes: form.notes || undefined,
        status: form.status
      });

      setSuccessMsg('Qard Hasanah disbursed successfully with zero interest and ledger settlement.');
      setTimeout(() => {
        router.push('/admin/qard-hasanah');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue Qard Hasanah');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Issue Qard Hasanah"
        subtitle="Disburse interest-free benevolent micro-financing with strictly zero interest"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/qard-hasanah"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Qard Hasanah</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero Interest (Principal Repaid = Principal Borrowed)</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-teal-700" />
              <span>Loan Disbursement Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading form parameters...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Borrower & Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Borrower Member <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.borrower_id}
                      onChange={(e) => handleMemberChange(e.target.value)}
                      required
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.member_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Associated Group (Optional)
                    </label>
                    <select
                      value={form.group_id}
                      onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">No Group / Individual</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Capital Fund & Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Capital Disbursement Fund <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.fund_id}
                      onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
                      required
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (Balance: ${f.current_balance})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Principal Loan Amount <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 10000.00"
                      value={form.principal_amount}
                      onChange={(e) => handlePrincipalOrCountChange(e.target.value, form.installment_count)}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Exact amount owed. Zero interest or fees will ever be added.
                    </p>
                  </div>
                </div>

                {/* Installments & Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Repayment Schedule
                    </label>
                    <select
                      value={form.repayment_schedule}
                      onChange={(e) => setForm({ ...form, repayment_schedule: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                      <option value="lump_sum">Lump Sum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Number of Installments
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={form.installment_count}
                      onChange={(e) => handlePrincipalOrCountChange(form.principal_amount, e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Installment Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.installment_amount}
                      onChange={(e) => setForm({ ...form, installment_amount: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Disbursement Date
                    </label>
                    <Input
                      type="date"
                      value={form.disbursement_date}
                      onChange={(e) => setForm({ ...form, disbursement_date: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Repayment Start Date
                    </label>
                    <Input
                      type="date"
                      value={form.repayment_start_date}
                      onChange={(e) => setForm({ ...form, repayment_start_date: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Initial Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="active">Active (Disburse Immediately)</option>
                      <option value="pending">Pending (Approval Pipeline)</option>
                    </select>
                  </div>
                </div>

                {/* Purpose & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Purpose of Loan
                    </label>
                    <Input
                      placeholder="e.g. Small business inventory, agricultural inputs, emergency"
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Administrative Notes
                    </label>
                    <Input
                      placeholder="e.g. Verified guarantor, approved by board"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/qard-hasanah')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || members.length === 0 || funds.length === 0}
                    className="bg-teal-700 hover:bg-teal-800 text-white"
                  >
                    {submitting ? 'Disbursing...' : 'Disburse Qard Hasanah'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
