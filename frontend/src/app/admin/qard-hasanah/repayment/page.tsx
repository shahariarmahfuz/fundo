'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { QardHasanahLoan, QardHasanahRepayment } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Coins, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, History, Wallet, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

function QardHasanahRepaymentContent() {
  const searchParams = useSearchParams();
  const preselectedLoanId = searchParams.get('loan_id') || '';

  const { hasPermission, loading: authLoading, user } = useAuth();
  const [activeLoans, setActiveLoans] = useState<QardHasanahLoan[]>([]);
  const [recentRepayments, setRecentRepayments] = useState<QardHasanahRepayment[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>(preselectedLoanId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: ''
  });

  const loadData = async () => {
    if (!hasPermission('qard_hasanah.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [loansRes, repRes] = await Promise.all([
        ApiClient.get<PaginatedResponse<QardHasanahLoan>>('/qard-hasanah?page=1&page_size=150'),
        ApiClient.get<PaginatedResponse<QardHasanahRepayment>>('/qard-hasanah/repayments?page=1&page_size=50')
      ]);

      const allLoans = loansRes.items || [];
      // Filter loans that have outstanding principal
      const payableLoans = allLoans.filter(
        (l) => l.status === 'active' || l.status === 'partially_repaid' || Number(l.outstanding_principal) > 0
      );
      setActiveLoans(payableLoans);
      setRecentRepayments(repRes.items || []);

      if (preselectedLoanId && payableLoans.some((l) => l.id === preselectedLoanId)) {
        setSelectedLoanId(preselectedLoanId);
      } else if (payableLoans.length > 0 && !selectedLoanId) {
        setSelectedLoanId(payableLoans[0].id);
      }
    } catch (err) {
      console.error('Failed to load repayment context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission]);

  const selectedLoan = activeLoans.find((l) => l.id === selectedLoanId);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('qard_hasanah.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Qard Hasanah Repayment"
          subtitle="Interest-free principal collection and ledger settlement"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="qard_hasanah.view"
          message="You do not have authorization to view Qard Hasanah repayments."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      setErrorMsg('Please select a loan record.');
      return;
    }

    const payAmount = parseFloat(form.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMsg('Please enter a valid positive repayment amount.');
      return;
    }

    if (payAmount > Number(selectedLoan.outstanding_principal)) {
      setErrorMsg(
        `Repayment amount (${formatCurrency(payAmount)}) cannot exceed outstanding principal (${formatCurrency(
          selectedLoan.outstanding_principal
        )}).`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await ApiClient.post<QardHasanahRepayment>(
        `/qard-hasanah/${selectedLoan.id}/repayments`,
        {
          amount: payAmount,
          payment_date: form.payment_date || undefined,
          payment_method: form.payment_method,
          reference: form.reference || undefined,
          notes: form.notes || undefined
        }
      );

      setSuccessMsg(
        `Repayment of ${formatCurrency(payAmount)} recorded successfully (Receipt: ${res.receipt_number}). Double-entry ledger updated.`
      );
      setForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record repayment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Qard Hasanah Repayment"
        subtitle="Repayment applies 100% to outstanding principal. Strictly zero interest or late fees."
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
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
            <span>100% Principal Reduction</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Repayment Form (Left / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-teal-700" />
                  <span>Record Principal Repayment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading loan balances...</div>
                ) : activeLoans.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active Qard Hasanah loans with outstanding balances.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Select Qard Hasanah Loan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedLoanId}
                        onChange={(e) => setSelectedLoanId(e.target.value)}
                        required
                        className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {activeLoans.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.loan_number} — {l.borrower_name} (Outstanding: {formatCurrency(l.outstanding_principal)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedLoan && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Borrower:</span>
                          <span className="font-semibold text-slate-800">{selectedLoan.borrower_name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Original Principal:</span>
                          <span className="font-medium text-slate-800">{formatCurrency(selectedLoan.principal_amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Total Repaid So Far:</span>
                          <span className="font-medium text-emerald-700">{formatCurrency(selectedLoan.total_repaid)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                          <span className="font-semibold text-slate-800">Remaining Balance (Max Repayment):</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {formatCurrency(selectedLoan.outstanding_principal)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Repayment Amount <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="1"
                          max={selectedLoan ? selectedLoan.outstanding_principal : undefined}
                          required
                          placeholder="e.g. 2000.00"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Payment Date <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          required
                          value={form.payment_date}
                          onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
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
                          <option value="mobile_money">Mobile Money (M-Pesa, bKash)</option>
                          <option value="cash">Cash Settlement</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Payment Reference / Txn #
                        </label>
                        <Input
                          placeholder="e.g. TR-923841 or Check #019"
                          value={form.reference}
                          onChange={(e) => setForm({ ...form, reference: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Repayment Notes
                      </label>
                      <Input
                        placeholder="e.g. Regular monthly installment, final clearance"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm({ amount: '', payment_date: '', payment_method: 'bank_transfer', reference: '', notes: '' })}
                        disabled={submitting}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || !selectedLoan || !hasPermission('qard_hasanah.repayment')}
                        className="bg-teal-700 hover:bg-teal-800 text-white"
                      >
                        {submitting ? 'Recording Settlement...' : 'Record Principal Repayment'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Rules & Balance Card (Right / 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Qard Hasanah Financial Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <p>
                    <strong>Zero Interest:</strong> Repayments apply solely toward reducing the outstanding principal. No interest is ever calculated or charged.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <p>
                    <strong>Cap Enforcement:</strong> Overpayment is strictly prevented. You cannot record a repayment larger than the remaining principal.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <p>
                    <strong>Double-Entry Ledger:</strong> Every repayment generates a verifiable financial transaction and credits the Foundation’s capital fund.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <p>
                    <strong>Automatic Completion:</strong> When the remaining principal reaches 0.00, the loan automatically marks as <em>Fully Repaid</em>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-800">Quick Navigation</div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <Link
                    href="/admin/qard-hasanah"
                    className="text-xs text-teal-700 hover:underline flex items-center justify-between"
                  >
                    <span>View All Qard Hasanah Loans</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/admin/qard-hasanah/reports"
                    className="text-xs text-teal-700 hover:underline flex items-center justify-between"
                  >
                    <span>View Qard Hasanah Reports</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/admin/transactions"
                    className="text-xs text-slate-500 hover:underline flex items-center justify-between"
                  >
                    <span>View System Financial Ledger</span>
                    <span>→</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Repayments Stream */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-teal-600" />
              <span>Recent Repayment Receipts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentRepayments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No repayments recorded yet in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Receipt</th>
                      <th className="py-2.5 px-4">Payment Date</th>
                      <th className="py-2.5 px-4">Loan #</th>
                      <th className="py-2.5 px-4">Borrower</th>
                      <th className="py-2.5 px-4">Method & Ref</th>
                      <th className="py-2.5 px-4 text-right">Principal Repaid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRepayments.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {r.receipt_number}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(r.payment_date)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-700">
                          {r.loan_number || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {r.borrower_name || 'Member'}
                        </td>
                        <td className="py-2.5 px-4 capitalize text-slate-600">
                          <div>{r.payment_method?.replace(/_/g, ' ')}</div>
                          {r.reference && <div className="text-[10px] text-slate-400 font-mono">{r.reference}</div>}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                          {formatCurrency(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QardHasanahRepaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <QardHasanahRepaymentContent />
    </Suspense>
  );
}

