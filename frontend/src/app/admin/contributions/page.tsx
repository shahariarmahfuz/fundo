'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Contribution, Member, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PiggyBank, Plus, Search, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    member_id: '',
    fund_id: '',
    amount: '',
    contribution_type: 'monthly_savings',
    payment_method: 'bank_transfer',
    payment_reference: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resC, resM, resF] = await Promise.all([
        ApiClient.get<PaginatedResponse<Contribution>>('/contributions?page=1&page_size=50'),
        ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=100'),
        ApiClient.get<Fund[]>('/finance/funds?active_only=true')
      ]);
      setContributions(resC.items);
      setMembers(resM.items);
      setFunds(resF);
      if (resM.items.length > 0 && !form.member_id) {
        setForm(f => ({ ...f, member_id: resM.items[0].id }));
      }
      if (resF.length > 0 && !form.fund_id) {
        setForm(f => ({ ...f, fund_id: resF[0].id }));
      }
    } catch (err) {
      console.error('Failed to load contributions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/contributions', {
        member_id: form.member_id,
        fund_id: form.fund_id,
        amount: parseFloat(form.amount),
        contribution_type: form.contribution_type,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || undefined
      });
      setShowModal(false);
      setForm(f => ({ ...f, amount: '', payment_reference: '' }));
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record contribution');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Member Savings & Contributions"
        subtitle="Manage regular member dues, mutual savings deposits, and equity shares"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            PostgreSQL ACID Double-Entry Transaction Ledger Enforced
          </div>

          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Record Contribution</span>
          </Button>
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Receipt #</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Fund Target</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading contributions ledger...
                      </td>
                    </tr>
                  ) : contributions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No contributions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    contributions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {c.receipt_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {c.member_name} <span className="font-mono font-normal text-slate-400 text-[11px]">({c.member_number})</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {c.contribution_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600">
                          {c.fund_name || 'General Operations Fund'}
                        </td>
                        <td className="p-3 capitalize text-slate-500">
                          {c.payment_method.replace('_', ' ')}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-800">
                          +{formatCurrency(c.amount)}
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(c.contribution_date)}
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
              <h3 className="text-sm font-bold text-slate-900">Record Member Contribution</h3>
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

            <form onSubmit={handleRecord} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Select Member</label>
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
                <label className="text-[11px] font-medium text-slate-700">Target Fund Pool</label>
                <select
                  required
                  value={form.fund_id}
                  onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({formatCurrency(f.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Contribution Type</label>
                  <select
                    value={form.contribution_type}
                    onChange={(e) => setForm({ ...form, contribution_type: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="monthly_savings">Monthly Savings</option>
                    <option value="welfare">Welfare Dues</option>
                    <option value="shares">Equity Shares</option>
                    <option value="emergency_fund">Emergency Reserve</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cash">Cash Deposit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Payment Reference</label>
                  <Input
                    value={form.payment_reference}
                    onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                    placeholder="e.g. M-PESA # / Check #"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Recording...' : 'Post to Ledger'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
