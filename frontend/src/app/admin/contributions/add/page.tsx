'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Member, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { PiggyBank, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddContributionPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    member_id: '',
    fund_id: '',
    amount: '',
    contribution_type: 'monthly_savings',
    payment_method: 'bank_transfer',
    payment_reference: ''
  });

  useEffect(() => {
    async function loadFormData() {
      if (!hasPermission('contributions.create')) {
        setLoadingData(false);
        return;
      }
      try {
        setLoadingData(true);
        const [resM, resF] = await Promise.all([
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=100').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);

        const memberList = (resM as PaginatedResponse<Member>).items || [];
        const fundList = (resF as Fund[]) || [];

        setMembers(memberList);
        setFunds(fundList);

        if (memberList.length > 0 && !form.member_id) {
          setForm((prev) => ({ ...prev, member_id: memberList[0].id }));
        }
        if (fundList.length > 0 && !form.fund_id) {
          setForm((prev) => ({ ...prev, fund_id: fundList[0].id }));
        }
      } catch (err) {
        console.error('Failed to load members or funds:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading) {
      loadFormData();
    }
  }, [authLoading, hasPermission]);

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

    if (!form.fund_id) {
      setErrorMsg('Please select a target fund.');
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
        fund_id: form.fund_id,
        amount: parsedAmount,
        contribution_type: form.contribution_type,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || undefined
      });

      setSuccessMsg('Contribution recorded successfully with double-entry ledger settlement.');
      setForm((prev) => ({
        ...prev,
        amount: '',
        payment_reference: ''
      }));

      setTimeout(() => {
        router.push('/admin/contributions');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Add Contribution"
        subtitle="Record member savings deposit, equity share, or capital contribution"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Contributions</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">ACID Double-Entry Accounting</span>
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
              <PiggyBank className="h-4 w-4 text-teal-700" />
              <span>Contribution Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading form options...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Member <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.member_id}
                      onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                      required
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {members.length === 0 ? (
                        <option value="">No members available</option>
                      ) : (
                        members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.member_number})
                          </option>
                        ))
                      )}
                    </select>
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
                      {funds.length === 0 ? (
                        <option value="">No active funds available</option>
                      ) : (
                        funds.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contribution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.contribution_type}
                      onChange={(e) => setForm({ ...form, contribution_type: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="monthly_savings">Monthly Savings</option>
                      <option value="equity_shares">Equity Shares</option>
                      <option value="emergency_fund">Emergency Fund</option>
                      <option value="special_deposit">Special Deposit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Amount <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 50.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

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
                      <option value="mobile_money">Mobile Money (M-Pesa, bKash, etc.)</option>
                      <option value="cash">Cash / In-Person</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Reference / Transaction ID
                    </label>
                    <Input
                      placeholder="e.g. TXN-89234190 or Check #004"
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                    disabled={submitting || members.length === 0 || funds.length === 0}
                    className="bg-teal-700 hover:bg-teal-800 text-white"
                  >
                    {submitting ? 'Recording...' : 'Record Contribution'}
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
