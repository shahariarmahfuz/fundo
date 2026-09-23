'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Fund } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Landmark, Plus, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminFundsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    fund_type: 'general',
    currency: 'USD',
    initial_balance: '0.0',
    description: ''
  });

  const loadData = async () => {
    if (!hasPermission('finance.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ApiClient.get<Fund[]>('/finance/funds');
      setFunds(res);
    } catch (err) {
      console.error('Failed to load funds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('finance.view')) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
    try {
      await ApiClient.post('/finance/funds', {
        code: form.code,
        name: form.name,
        fund_type: form.fund_type,
        currency: form.currency,
        initial_balance: parseFloat(form.initial_balance) || 0.0,
        description: form.description || undefined
      });
      setShowModal(false);
      setForm({ code: '', name: '', fund_type: 'general', currency: 'USD', initial_balance: '0.0', description: '' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create fund pool');
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !hasPermission('finance.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Foundation Funds & Capital Accounts"
          subtitle="Segregated fiduciary accounts and permanent endowments"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="finance.view"
          message="You do not have authorization to view the financial funds and capital accounts."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Foundation Funds & Capital Accounts"
        subtitle="Manage segregated accounts, revolving pools, and permanent endowments"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            PostgreSQL Multi-Fund Double-Entry Accounting
          </div>

          {hasPermission('finance.create') && (
            <Button
              onClick={() => {
                setForm({
                  ...form,
                  code: `FND-0${funds.length + 1}`
                });
                setShowModal(true);
              }}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Establish Fund</span>
            </Button>
          )}
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Fund Code</th>
                    <th className="p-3">Fund Designation</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Currency</th>
                    <th className="p-3">Current Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-6 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading funds...
                      </td>
                    </tr>
                  ) : (
                    funds.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {f.code}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {f.name}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {f.fund_type}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {f.currency}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-800 text-sm">
                          {formatCurrency(f.current_balance, f.currency)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={f.is_active ? 'success' : 'default'}
                            className="text-[10px] uppercase"
                          >
                            {f.is_active ? 'ACTIVE' : 'FROZEN'}
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(f.created_at)}
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
              <h3 className="text-sm font-bold text-slate-900">Establish Foundation Fund</h3>
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
                <label className="text-[11px] font-medium text-slate-700">Fund Code</label>
                <Input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Fund Name</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Healthcare Emergency Facility"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Fund Type</label>
                  <select
                    value={form.fund_type}
                    onChange={(e) => setForm({ ...form, fund_type: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="general">General Operational</option>
                    <option value="sadaqa_zakat">Sadaqa & Zakat Restricted</option>
                    <option value="loan_pool">Qard Hasan Loan Pool</option>
                    <option value="endowment">Waqf / Endowment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Initial Balance ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.initial_balance}
                    onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Purpose, investment restrictions, and mandates"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Establish Fund'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
