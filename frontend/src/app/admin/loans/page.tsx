'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Loan, Member, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Coins, Plus, AlertCircle, X, CreditCard, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminLoansPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  // Disburse Modal State
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Repayment Modal State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('bank_transfer');
  const [repayRef, setRepayRef] = useState('');

  const [form, setForm] = useState({
    member_id: '',
    fund_id: '',
    principal_amount: '',
    interest_rate: '0.0',
    term_months: '12',
    purpose: ''
  });

  const loadData = async () => {
    if (!hasPermission('loans.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const resL = await ApiClient.get<PaginatedResponse<Loan>>('/loans?page=1&page_size=50');
      setLoans(resL.items);

      if (hasPermission('members.view')) {
        try {
          const resM = await ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=100');
          setMembers(resM.items);
          if (resM.items.length > 0 && !form.member_id) {
            setForm(f => ({ ...f, member_id: resM.items[0].id }));
          }
        } catch {}
      }

      if (hasPermission('finance.view')) {
        try {
          const resF = await ApiClient.get<Fund[]>('/finance/funds?active_only=true');
          setFunds(resF);
          const loanPool = resF.find(f => f.fund_type === 'loan_pool') || resF[0];
          if (loanPool && !form.fund_id) {
            setForm(f => ({ ...f, fund_id: loanPool.id }));
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('loans.view')) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/loans', {
        member_id: form.member_id,
        fund_id: form.fund_id,
        principal_amount: parseFloat(form.principal_amount),
        interest_rate: parseFloat(form.interest_rate),
        term_months: parseInt(form.term_months, 10),
        purpose: form.purpose || undefined
      });
      setShowDisburseModal(false);
      setForm(f => ({ ...f, principal_amount: '', purpose: '' }));
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to disburse loan');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/loans/repayments', {
        loan_id: selectedLoan.id,
        amount: parseFloat(repayAmount),
        payment_method: repayMethod,
        payment_reference: repayRef || undefined
      });
      setShowRepayModal(false);
      setSelectedLoan(null);
      setRepayAmount('');
      setRepayRef('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record repayment');
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !hasPermission('loans.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Qard Hasan Micro-Loan Portfolio"
          subtitle="Interest-free revolving credit facilities and recovery cycles"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="loans.view"
          message="You do not have authorization to view the loan portfolio."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Qard Hasan Micro-Loan Portfolio"
        subtitle="Manage interest-free revolving credit facilities, disbursements, and recovery cycles"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            100% Non-Interest Revolving Capital Cycle
          </div>

          {hasPermission('loans.create') && (
            <Button
              onClick={() => setShowDisburseModal(true)}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Disburse Revolving Loan</span>
            </Button>
          )}
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Loan #</th>
                    <th className="p-3">Borrower Member</th>
                    <th className="p-3">Principal</th>
                    <th className="p-3">Monthly Inst.</th>
                    <th className="p-3">Repaid</th>
                    <th className="p-3">Outstanding</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading loan portfolio...
                      </td>
                    </tr>
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No loans currently active.
                      </td>
                    </tr>
                  ) : (
                    loans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {l.loan_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {l.member_name} <span className="text-[11px] font-mono text-slate-400">({l.member_number})</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {formatCurrency(l.principal_amount)}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {formatCurrency(l.monthly_installment)} / mo
                        </td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">
                          {formatCurrency(l.total_repaid)}
                        </td>
                        <td className="p-3 font-mono text-amber-700 font-bold">
                          {formatCurrency(l.outstanding_balance)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={l.status === 'completed' ? 'success' : 'info'}
                            className="text-[10px] uppercase"
                          >
                            {l.status}
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right">
                          {l.status === 'active' && hasPermission('loans.create') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLoan(l);
                                setRepayAmount(l.monthly_installment.toString());
                                setShowRepayModal(true);
                              }}
                              className="h-7 text-xs px-2.5"
                            >
                              Repay
                            </Button>
                          )}
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

      {/* DISBURSE MODAL */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Disburse Zero-Interest Loan</h3>
              <button onClick={() => setShowDisburseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDisburse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Eligible Borrower Member</label>
                <select
                  required
                  value={form.member_id}
                  onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Revolving Pool Fund</label>
                <select
                  required
                  value={form.fund_id}
                  onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Available: {formatCurrency(f.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Principal Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={form.principal_amount}
                    onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
                    placeholder="2500.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Term (Months)</label>
                  <select
                    value={form.term_months}
                    onChange={(e) => setForm({ ...form, term_months: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Loan Purpose</label>
                <Input
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Bulk inventory purchase for textile workshop"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDisburseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Disbursing...' : 'Disburse Capital'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAY MODAL */}
      {showRepayModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Installment Repayment</h3>
              <button onClick={() => setShowRepayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Loan Number:</span>
                <span className="font-mono font-bold text-slate-800">{selectedLoan.loan_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-semibold text-slate-800">{selectedLoan.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-mono font-bold text-amber-700">{formatCurrency(selectedLoan.outstanding_balance)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRepay} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Repayment Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Payment Method</label>
                  <select
                    value={repayMethod}
                    onChange={(e) => setRepayMethod(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cash">Cash Deposit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Reference</label>
                  <Input
                    value={repayRef}
                    onChange={(e) => setRepayRef(e.target.value)}
                    placeholder="Check / Tx Ref"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowRepayModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Processing...' : 'Post Repayment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
