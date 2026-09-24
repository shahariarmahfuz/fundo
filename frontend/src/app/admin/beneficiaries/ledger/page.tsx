'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Beneficiary } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, BookOpen, ArrowLeft, HeartHandshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function BeneficiaryLedgerPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission, loading: authLoading, user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!hasPermission('beneficiaries.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await ApiClient.get<PaginatedResponse<Beneficiary>>('/beneficiaries?page=1&page_size=100');
        setBeneficiaries(res.items || []);
      } catch (err) {
        console.error('Failed to load beneficiary ledger data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('beneficiaries.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Beneficiary Ledger"
          subtitle="Assistance tracking and historical aid ledger"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="beneficiaries.view"
          message="You do not have authorization to view the beneficiary ledger."
        />
      </div>
    );
  }

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch =
      b.full_name.toLowerCase().includes(search.toLowerCase()) ||
      b.beneficiary_code.toLowerCase().includes(search.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalAssistanceDisbursed = filteredBeneficiaries.reduce(
    (sum, b) => sum + (Number(b.total_aid_received) || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Beneficiary Ledger"
        subtitle="Individual recipient aid disbursements, verification audits, and grant records"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/beneficiaries"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Manage Beneficiaries</span>
          </Link>
        </div>

        {/* METRICS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Recorded Beneficiaries</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{filteredBeneficiaries.length}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Verified active recipients</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Total Aid Disbursed</div>
              <div className="text-xl font-bold text-teal-700 mt-1">
                {formatCurrency(totalAssistanceDisbursed)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Direct grant transfers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-slate-500 font-medium">Average Aid per Beneficiary</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(
                  filteredBeneficiaries.length > 0
                    ? totalAssistanceDisbursed / filteredBeneficiaries.length
                    : 0
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Cumulative average balance</div>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-700" />
                <CardTitle>Beneficiary Grant & Assistance Ledger</CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by code, name, location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Categories</option>
                  <option value="widow">Widow</option>
                  <option value="orphan">Orphan Support</option>
                  <option value="disabled">Special Needs</option>
                  <option value="elderly">Elderly</option>
                  <option value="student">Student</option>
                  <option value="displaced">Displaced</option>
                  <option value="poverty">Extreme Poverty</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 pl-6">Code</th>
                    <th className="p-3">Beneficiary Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Assistance Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-6">Total Aid Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading beneficiary ledger records...
                      </td>
                    </tr>
                  ) : filteredBeneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No beneficiary records found.
                      </td>
                    </tr>
                  ) : (
                    filteredBeneficiaries.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 pl-6 font-mono text-[11px] font-semibold text-slate-900">
                          {b.beneficiary_code}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900">{b.full_name}</div>
                          {b.phone && <div className="text-[10px] text-slate-400">{b.phone}</div>}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {b.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600 capitalize text-[11px]">
                          {b.assistance_type}
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">
                          {b.location || '—'}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={b.status === 'active' || b.status === 'verified' ? 'success' : 'outline'}
                            className="text-[10px] capitalize font-mono"
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right pr-6 font-bold text-slate-900 font-mono text-xs">
                          {formatCurrency(b.total_aid_received)}
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
    </div>
  );
}
