'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { Beneficiary } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HeartHandshake, Search, Plus, UserPlus, AlertCircle, X } from 'lucide-react';

export default function AdminBeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    beneficiary_code: '',
    full_name: '',
    category: 'widow',
    assistance_type: 'financial',
    location: '',
    phone: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      let url = `/beneficiaries?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      const res = await ApiClient.get<PaginatedResponse<Beneficiary>>(url);
      setBeneficiaries(res.items);
    } catch (err) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg('');
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
      setShowModal(false);
      setForm({
        beneficiary_code: '',
        full_name: '',
        category: 'widow',
        assistance_type: 'financial',
        location: '',
        phone: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register beneficiary');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Beneficiary Registry"
        subtitle="Manage verified recipients of charitable stipends, orphan care, and emergency grants"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, code, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </form>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="widow">Widow</option>
              <option value="orphan">Orphan</option>
              <option value="disability">Disability</option>
              <option value="student">Student</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <Button
            onClick={() => {
              setForm({
                ...form,
                beneficiary_code: `BEN-${Math.floor(1000 + Math.random() * 9000)}`
              });
              setShowModal(true);
            }}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Beneficiary</span>
          </Button>
        </div>

        {/* TABLE */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Code</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Assistance Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Total Aid Disbursed</th>
                    <th className="p-3 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading beneficiary roster...
                      </td>
                    </tr>
                  ) : beneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No beneficiaries found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    beneficiaries.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {b.beneficiary_code}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {b.full_name}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {b.category}
                          </Badge>
                        </td>
                        <td className="p-3 capitalize text-slate-600">
                          {b.assistance_type}
                        </td>
                        <td className="p-3 text-slate-500">
                          {b.location || '—'}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-800">
                          {formatCurrency(b.total_aid_received)}
                        </td>
                        <td className="p-3 pr-6 text-right">
                          <Badge
                            variant={b.status === 'active' ? 'success' : 'default'}
                            className="text-[10px] uppercase"
                          >
                            {b.status}
                          </Badge>
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register Beneficiary</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Code</label>
                  <Input
                    required
                    value={form.beneficiary_code}
                    onChange={(e) => setForm({ ...form, beneficiary_code: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Full Name</label>
                  <Input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Fatima Zahra Family"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="widow">Widow</option>
                    <option value="orphan">Orphan</option>
                    <option value="disability">Disability</option>
                    <option value="student">Student</option>
                    <option value="emergency">Emergency Relief</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Assistance Type</label>
                  <select
                    value={form.assistance_type}
                    onChange={(e) => setForm({ ...form, assistance_type: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
                  >
                    <option value="financial">Financial Stipend</option>
                    <option value="educational">Educational Scholarship</option>
                    <option value="healthcare">Healthcare / Medical</option>
                    <option value="food">Food Staples Basket</option>
                    <option value="shelter">Emergency Housing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Location / Neighborhood</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. North Sector, Ward 3"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Register Beneficiary'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
