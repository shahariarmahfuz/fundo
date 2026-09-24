'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { SadaqaDonation, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  HandHeart,
  Plus,
  Search,
  ArrowRight,
  Filter,
  Eye,
  Trash2,
  X,
  Printer,
  ShieldCheck,
  Building,
  User,
  HeartHandshake,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function ManageSadaqaPage() {
  const { hasPermission, loading: authLoading, user, isSuperAdmin } = useAuth();
  const [donations, setDonations] = useState<SadaqaDonation[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedFund, setSelectedFund] = useState('all');
  const [selectedDonorType, setSelectedDonorType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Receipt Modal
  const [selectedDonation, setSelectedDonation] = useState<SadaqaDonation | null>(null);

  // Delete / Void confirmation modal
  const [donationToVoid, setDonationToVoid] = useState<SadaqaDonation | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canCreate = isSuperAdmin || hasPermission('sadaqa.create');
  const canDelete = isSuperAdmin || hasPermission('sadaqa.delete');

  const loadFunds = async () => {
    try {
      const res = await ApiClient.get<Fund[]>('/finance/funds?active_only=true');
      setFunds(res || []);
    } catch (err) {
      console.error('Failed to load funds:', err);
    }
  };

  const loadData = async () => {
    if (!hasPermission('sadaqa.view') && !hasPermission('donations.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      });
      if (selectedFund !== 'all') params.append('fund_id', selectedFund);
      if (selectedDonorType !== 'all') params.append('donor_type', selectedDonorType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      const res = await ApiClient.get<PaginatedResponse<SadaqaDonation>>(`/sadaqa?${params.toString()}`);
      setDonations(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load Sadaqa records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission, page, selectedFund, selectedDonorType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleVoidDonation = async () => {
    if (!donationToVoid) return;
    setVoiding(true);
    setActionMsg(null);
    try {
      await ApiClient.delete(`/sadaqa/${donationToVoid.id}`);
      setActionMsg({ type: 'success', text: `Sadaqa ${donationToVoid.receipt_number} has been voided and accounting reversed.` });
      setDonationToVoid(null);
      loadData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to void donation.' });
    } finally {
      setVoiding(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('sadaqa.view') && !hasPermission('donations.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Sadaqa / Donations"
          subtitle="Charitable contributions management"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="sadaqa.view"
          message="You do not have authorization to view Sadaqa and donation records."
        />
      </div>
    );
  }

  const totalVolume = donations.reduce((sum, d) => (d.status === 'completed' ? sum + Number(d.amount) : sum), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Sadaqa / Donations"
        subtitle="Manage permanent charitable donations, donor registries, and fund inflows"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Actions & Quick Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-teal-700" />
              <span>Sadaqa Records Registry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly permanent benevolent donations with double-entry fund settlement. No repayment required.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/sadaqa/reports">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                <span>View Reports</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {canCreate && (
              <Link href="/admin/sadaqa/add">
                <Button size="sm" className="h-9 gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white">
                  <Plus className="h-4 w-4" />
                  <span>Add Sadaqa</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {actionMsg && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              actionMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button type="button" onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search receipt, donor name, reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Fund Filter */}
              <div>
                <select
                  value={selectedFund}
                  onChange={(e) => {
                    setSelectedFund(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="all">All Funds</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Donor Type Filter */}
              <div>
                <select
                  value={selectedDonorType}
                  onChange={(e) => {
                    setSelectedDonorType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="all">All Donor Types</option>
                  <option value="member">Foundation Member</option>
                  <option value="beneficiary">Beneficiary</option>
                  <option value="other">External / Non-Member</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sadaqa Table */}
        <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <span>Sadaqa Donations</span>
              <span className="text-[11px] font-normal text-slate-500">
                ({totalCount} {totalCount === 1 ? 'record' : 'records'})
              </span>
            </CardTitle>
            <div className="text-xs text-slate-500 font-mono">
              Page {page} of {totalPages}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Loading Sadaqa records...
              </div>
            ) : donations.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 mb-3">
                  <HandHeart className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No Sadaqa records found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  No charitable donations match the selected filter criteria.
                </p>
                {canCreate && (
                  <Link href="/admin/sadaqa/add">
                    <Button size="sm" className="h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add New Sadaqa
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold select-none">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Fund</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-teal-800">
                          {d.receipt_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {d.is_anonymous ? (
                              <span className="italic text-slate-500">Anonymous Donor</span>
                            ) : (
                              <span>{d.donor_name}</span>
                            )}
                          </div>
                          <div className="mt-0.5">
                            {d.donor_type === 'member' ? (
                              <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-medium">
                                Member {d.member_number ? `(${d.member_number})` : ''}
                              </span>
                            ) : d.donor_type === 'beneficiary' ? (
                              <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-medium">
                                Beneficiary
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                External Donor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(d.amount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {formatDate(d.donation_date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800">{d.fund_name || 'General Fund'}</span>
                          {d.fund_code && (
                            <span className="ml-1 text-[10px] font-mono text-slate-400">
                              [{d.fund_code}]
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 capitalize whitespace-nowrap text-slate-600">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {d.payment_method?.replace(/_/g, ' ')}
                          </span>
                          {d.reference && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Ref: {d.reference}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-[160px] truncate text-slate-600" title={d.purpose || ''}>
                          {d.purpose || 'General Sadaqa'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {d.created_by || 'Staff'}
                        </td>
                        <td className="py-3 px-4">
                          {d.status === 'completed' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                              Cancelled
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDonation(d)}
                            className="h-7 px-2 text-slate-600 hover:text-teal-700"
                            title="View Receipt Voucher"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && d.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDonationToVoid(d)}
                              className="h-7 px-2 text-slate-400 hover:text-rose-600"
                              title="Void / Cancel Donation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Printable Receipt Voucher Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
                  Official Sadaqa Donation Receipt
                </div>
                <div className="text-base font-bold font-mono mt-0.5">{selectedDonation.receipt_number}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-[11px] text-emerald-800 uppercase font-semibold">Total Amount Received</div>
                <div className="text-2xl font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(selectedDonation.amount)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">Permanent Voluntary Donation • Zero Repayment</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Donor Name</div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5">
                    {selectedDonation.is_anonymous ? 'Anonymous Donor' : selectedDonation.donor_name}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Donor Classification</div>
                  <div className="capitalize font-medium text-slate-700 mt-0.5">
                    {selectedDonation.donor_type === 'member'
                      ? 'Registered Member'
                      : selectedDonation.donor_type === 'beneficiary'
                      ? 'Registered Beneficiary'
                      : 'Non-Member / Guest'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Donation Date</div>
                  <div className="font-medium text-slate-700 mt-0.5">{formatDate(selectedDonation.donation_date)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Destination Fund</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedDonation.fund_name} ({selectedDonation.fund_code})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Payment Method</div>
                  <div className="capitalize font-medium text-slate-700 mt-0.5">
                    {selectedDonation.payment_method?.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Reference Number</div>
                  <div className="font-mono text-slate-700 mt-0.5">{selectedDonation.reference || '—'}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase">Charitable Purpose</div>
                <div className="font-medium text-slate-800">{selectedDonation.purpose || 'General Sadaqa'}</div>
              </div>

              {selectedDonation.notes && (
                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase">Auditor / Donor Notes</div>
                  <div className="text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedDonation.notes}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Recorded By: {selectedDonation.created_by || 'Staff'}</span>
                <span>Audit Status: {selectedDonation.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs text-slate-700"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDonation(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {donationToVoid && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Void Sadaqa Donation?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receipt: <span className="font-mono font-medium text-slate-700">{donationToVoid.receipt_number}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              Voiding this Sadaqa donation will reverse the fund balance by{' '}
              <strong>{formatCurrency(donationToVoid.amount)}</strong> and record offsetting double-entry ledger entries.
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={voiding}
                onClick={() => setDonationToVoid(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={voiding}
                onClick={handleVoidDonation}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {voiding ? 'Reversing Entry...' : 'Confirm & Void'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
