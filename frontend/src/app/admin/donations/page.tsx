'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Donation, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HandHeart, Plus, Search, AlertCircle, X } from 'lucide-react';

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    donor_name: '',
    donor_email: '',
    is_anonymous: false,
    amount: '',
    donation_category: 'sadaqa',
    fund_id: '',
    payment_method: 'bank_transfer',
    payment_reference: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resD, resF] = await Promise.all([
        ApiClient.get<PaginatedResponse<Donation>>('/finance/donations?page=1&page_size=50'),
        ApiClient.get<Fund[]>('/finance/funds?active_only=true')
      ]);
      setDonations(resD.items);
      setFunds(resF);
      const zakatFund = resF.find(f => f.fund_type === 'sadaqa_zakat') || resF[0];
      if (zakatFund && !form.fund_id) {
        setForm(f => ({ ...f, fund_id: zakatFund.id }));
      }
    } catch (err) {
      console.error('Failed to load donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/finance/donations', {
        donor_name: form.is_anonymous ? 'Anonymous Donor' : form.donor_name,
        donor_email: form.donor_email || undefined,
        is_anonymous: form.is_anonymous,
        amount: parseFloat(form.amount),
        donation_category: form.donation_category,
        fund_id: form.fund_id,
        payment_method: form.payment_method,
        payment_reference: form.payment_reference || undefined,
        notes: form.notes || undefined
      });
      setShowModal(false);
      setForm(f => ({ ...f, donor_name: '', donor_email: '', amount: '', payment_reference: '', notes: '' }));
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record donation');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Sadaqa & Zakat Charitable Inflows"
        subtitle="Manage designated humanitarian gifts, public endowments, and zero-overhead relief pools"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            100% Policy-Restricted Segregation Guaranteed
          </div>

          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Record Sadaqa / Donation</span>
          </Button>
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Receipt #</th>
                    <th className="p-3">Donor</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Fund Target</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 pr-6 text-right">Received Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading donations...
                      </td>
                    </tr>
                  ) : donations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No donations recorded.
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {d.receipt_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {d.is_anonymous ? (
                            <span className="italic text-slate-400">Anonymous Donor</span>
                          ) : (
                            d.donor_name
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="info" className="text-[10px] uppercase font-mono">
                            {d.donation_category}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600">
                          {d.fund_name}
                        </td>
                        <td className="p-3 capitalize text-slate-500">
                          {d.payment_method.replace('_', ' ')}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-800">
                          +{formatCurrency(d.amount)}
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(d.donation_date)}
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
              <h3 className="text-sm font-bold text-slate-900">Record Philanthropic Inflow</h3>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Donor Name</label>
                <Input
                  required={!form.is_anonymous}
                  disabled={form.is_anonymous}
                  value={form.donor_name}
                  onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                  placeholder="e.g. Sheikh Abdullah Al-Sabah"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anon"
                  checked={form.is_anonymous}
                  onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <label htmlFor="anon" className="text-xs text-slate-600">
                  Mark donor as anonymous on public receipts
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Category</label>
                  <select
                    value={form.donation_category}
                    onChange={(e) => setForm({ ...form, donation_category: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="sadaqa">Sadaqa</option>
                    <option value="zakat">Zakat</option>
                    <option value="general">General Donation</option>
                    <option value="emergency">Emergency Relief</option>
                    <option value="waqf">Waqf / Endowment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1000.00"
                  />
                </div>
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
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Recording...' : 'Post Donation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
