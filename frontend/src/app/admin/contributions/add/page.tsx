'use client';

import { Suspense, useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Member, Fund, MemberDuePreview } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import {
  PiggyBank,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  ShieldCheck,
  Info,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

// Helper to generate selectable months (last 12 months + next 2 months)
function getSelectableMonths() {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -12; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value: val, label });
  }
  return months;
}

function AddContributionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, loading: authLoading, user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Default month is current YYYY-MM
  const currentMonthVal = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const initialMemberId = searchParams.get('member_id') || '';
  const initialMonth = searchParams.get('month') || currentMonthVal;

  const [form, setForm] = useState({
    member_id: initialMemberId,
    fund_id: '',
    contribution_month: initialMonth,
    amount: '',
    contribution_type: 'monthly_savings',
    payment_method: 'bank_transfer',
    payment_reference: '',
    notes: '',
    contribution_date: new Date().toISOString().split('T')[0]
  });

  const [previewDue, setPreviewDue] = useState<MemberDuePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load members and funds
  useEffect(() => {
    async function loadFormData() {
      if (!hasPermission('contributions.create')) {
        setLoadingData(false);
        return;
      }
      try {
        setLoadingData(true);
        const [resM, resF] = await Promise.all([
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=200').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);

        const memberList = (resM as PaginatedResponse<Member>).items || [];
        const fundList = (resF as Fund[]) || [];

        setMembers(memberList);
        setFunds(fundList);

        // Auto select first member if not provided
        let selectedMid = form.member_id;
        if (!selectedMid && memberList.length > 0) {
          selectedMid = memberList[0].id;
          setForm((prev) => ({ ...prev, member_id: memberList[0].id }));
        }

        // Auto select first fund
        if (fundList.length > 0 && !form.fund_id) {
          setForm((prev) => ({ ...prev, fund_id: fundList[0].id }));
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading) {
      loadFormData();
    }
  }, [authLoading, hasPermission]);

  // Load dynamic Due Preview whenever selected member or contribution_month changes
  useEffect(() => {
    async function fetchDuePreview() {
      if (!form.member_id || !form.contribution_month) {
        setPreviewDue(null);
        return;
      }
      try {
        setLoadingPreview(true);
        const data = await ApiClient.get<MemberDuePreview>(
          `/contributions/preview-due?member_id=${form.member_id}&month=${form.contribution_month}`
        );
        setPreviewDue(data);
        // Pre-fill amount with outstanding due if empty or 0
        if (!form.amount) {
          if (data.outstanding_due > 0) {
            setForm((prev) => ({ ...prev, amount: String(data.outstanding_due) }));
          } else {
            setForm((prev) => ({ ...prev, amount: String(data.base_contribution) }));
          }
        }
      } catch (err) {
        console.error('Failed to load due preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    }

    if (form.member_id && form.contribution_month) {
      fetchDuePreview();
    }
  }, [form.member_id, form.contribution_month]);

  // Find currently selected member object
  const selectedMember = members.find((m) => m.id === form.member_id);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('contributions.create')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Add Contribution"
          subtitle="Record member savings deposit or equity contribution"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="contributions.create"
          message="You do not have authorization to record new contributions."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.member_id) {
      setErrorMsg('Please select a member.');
      setSubmitting(false);
      return;
    }

    if (!selectedMember?.group_id) {
      setErrorMsg('Selected member is not assigned to any Group. A group assignment is required.');
      setSubmitting(false);
      return;
    }

    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid contribution amount greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      await ApiClient.post('/contributions', {
        member_id: form.member_id,
        fund_id: form.fund_id || undefined,
        amount: parsedAmount,
        contribution_month: form.contribution_month,
        contribution_type: form.contribution_type,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || undefined,
        notes: form.notes || undefined,
        contribution_date: form.contribution_date
      });

      setSuccessMsg(`Contribution of ${formatCurrency(parsedAmount)} recorded and allocated to ${previewDue?.group_name || 'Group Fund'} with double-entry ledger settlement.`);
      setForm((prev) => ({
        ...prev,
        amount: '',
        payment_reference: '',
        notes: ''
      }));

      setTimeout(() => {
        router.push('/admin/contributions');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedEnteredAmount = parseFloat(form.amount) || 0;
  const currentOutstanding = previewDue?.outstanding_due ?? 0;
  const currentBase = previewDue?.base_contribution ?? 100;
  const alreadyPaidAmount = previewDue?.already_paid ?? 0;

  const selectableMonths = getSelectableMonths();

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
      <AdminHeader
        title="Record Member Contribution"
        subtitle="Individual savings deposits, group fund allocation, and ledger reconciliation"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6 mx-auto w-full">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Contributions</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Group Fund Accounting Enforced</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-teal-700" />
              <span>Contribution Details & Due Calculation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading form parameters...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Member & Locked Group Hierarchy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Select Member <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.member_id}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, member_id: e.target.value, amount: '' }));
                      }}
                      required
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {members.length === 0 ? (
                        <option value="">No members available</option>
                      ) : (
                        members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.member_number}) {m.group_name ? `— ${m.group_name}` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Group must follow member (Locked & clearly highlighted) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Member's Group Allocation <span className="text-slate-400 font-normal">(Auto-Locked)</span>
                    </label>
                    <div className="flex items-center gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 text-xs">
                      <Users className="h-4 w-4 text-teal-700 shrink-0" />
                      <div className="flex-1 truncate">
                        {previewDue?.group_name ? (
                          <div className="font-semibold text-slate-800">
                            {previewDue.group_name}
                            <Badge variant="outline" className="ml-2 text-[10px] bg-white">
                              Group Fund Bound
                            </Badge>
                          </div>
                        ) : selectedMember?.group_id ? (
                          <span className="text-slate-700 font-medium">Assigned Group</span>
                        ) : (
                          <span className="text-rose-600 font-medium">⚠️ No Group Assigned (Required)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Accounting Month & Target Fund */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contribution Accounting Month <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.contribution_month}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, contribution_month: e.target.value, amount: '' }));
                        }}
                        required
                        className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {selectableMonths.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label} ({m.value}) {m.value === currentMonthVal ? '— Current Month' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Contributions may be recorded for any past or upcoming accounting period.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Target Fund Account <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.fund_id}
                      onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
                      required
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code}) — Balance: {formatCurrency(f.current_balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Dynamic Due Breakdown Calculation Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-700" />
                      Monthly Status for {form.contribution_month}
                    </span>
                    {loadingPreview && <span className="text-slate-400">Recalculating dues...</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-md border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Base Monthly Expected</span>
                      <span className="text-base font-bold text-slate-800">
                        {formatCurrency(currentBase)}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-md border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Already Paid</span>
                      <span className="text-base font-bold text-emerald-600">
                        {formatCurrency(alreadyPaidAmount)}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-md border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Outstanding Due</span>
                      <span className={`text-base font-bold ${currentOutstanding > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {formatCurrency(currentOutstanding)}
                      </span>
                    </div>
                  </div>

                  {currentOutstanding > 0 ? (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between">
                      <span>Member has an outstanding due of {formatCurrency(currentOutstanding)} for this month.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm((prev) => ({ ...prev, amount: String(currentOutstanding) }))}
                        className="text-[11px] h-6 px-2 bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                      >
                        Autofill Due ({formatCurrency(currentOutstanding)})
                      </Button>
                    </div>
                  ) : alreadyPaidAmount >= currentBase ? (
                    <div className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded border border-teal-200">
                      ✓ Member has already satisfied the standard monthly base of {formatCurrency(currentBase)}. Any additional payment will be credited as surplus savings.
                    </div>
                  ) : null}
                </div>

                {/* 4. Payment Amount & Payment Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Actual Payment Amount <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, amount: '50' }))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          ৳50
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, amount: '100' }))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          ৳100
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, amount: '150' }))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          ৳150
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, amount: '500' }))}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          ৳500
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder="e.g. 50, 100, 150, 500"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="pl-8 text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {parsedEnteredAmount > 0 && currentOutstanding > 0 && parsedEnteredAmount < currentOutstanding ? (
                        <span className="text-amber-600">
                          Partial payment: leaves {formatCurrency(currentOutstanding - parsedEnteredAmount)} outstanding due.
                        </span>
                      ) : parsedEnteredAmount > 0 && parsedEnteredAmount > currentOutstanding && currentOutstanding > 0 ? (
                        <span className="text-teal-700">
                          Settles {formatCurrency(currentOutstanding)} due + {formatCurrency(parsedEnteredAmount - currentOutstanding)} surplus savings.
                        </span>
                      ) : parsedEnteredAmount > 0 && currentOutstanding === 0 ? (
                        <span className="text-teal-700">
                          Voluntary contribution: {formatCurrency(parsedEnteredAmount)} credited to member passbook & group fund.
                        </span>
                      ) : (
                        'Accepts any valid amount (partial, exact base, or surplus payment).'
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      required
                      value={form.contribution_date}
                      onChange={(e) => setForm({ ...form, contribution_date: e.target.value })}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Actual date when funds were received by the Foundation.
                    </p>
                  </div>
                </div>

                {/* 5. Payment Method & Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money (bKash, Nagad, M-Pesa)</option>
                      <option value="cash">Cash / In-Person Collector</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Reference / TrxID
                    </label>
                    <Input
                      placeholder="e.g. TRX-8890214 or Cash Receipt #12"
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* 6. Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Notes / Memo <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Collected during monthly group circle meeting"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="text-xs"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Double-entry ledger journal will credit Member Savings Liability.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/admin/contributions')}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitting || members.length === 0 || !selectedMember?.group_id}
                      className="bg-teal-700 hover:bg-teal-800 text-white"
                    >
                      {submitting ? 'Recording & Settling...' : 'Record Contribution'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AddContributionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading contribution form...</div>}>
      <AddContributionContent />
    </Suspense>
  );
}
