'use client';

import { useState, useEffect } from 'react';
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
import { Coins, Plus, Search, ArrowRight, ShieldCheck, History, X, Wallet, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function ManageQardHasanahPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [loans, setLoans] = useState<QardHasanahLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Repayment history modal state
  const [selectedLoan, setSelectedLoan] = useState<QardHasanahLoan | null>(null);
  const [repayments, setRepayments] = useState<QardHasanahRepayment[]>([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);

  const loadData = async () => {
    if (!hasPermission('qard_hasanah.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      });
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());

      const res = await ApiClient.get<PaginatedResponse<QardHasanahLoan>>(`/qard-hasanah?${params.toString()}`);
      setLoans(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load Qard Hasanah loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission, page, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleViewHistory = async (loan: QardHasanahLoan) => {
    setSelectedLoan(loan);
    setLoadingRepayments(true);
    try {
      const res = await ApiClient.get<PaginatedResponse<QardHasanahRepayment>>(`/qard-hasanah/${loan.id}/repayments?page_size=100`);
      setRepayments(res.items || []);
    } catch (err) {
      console.error('Failed to load repayments:', err);
    } finally {
      setLoadingRepayments(false);
    }
  };

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
          title="Qard Hasanah"
          subtitle="Interest-free micro-financing and benevolent credit management"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="qard_hasanah.view"
          message="You do not have authorization to view the Qard Hasanah portfolio."
        />
      </div>
    );
  }

  const totalPrincipal = loans.reduce((sum, l) => sum + (Number(l.principal_amount) || 0), 0);
  const totalRepaid = loans.reduce((sum, l) => sum + (Number(l.total_repaid) || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (Number(l.outstanding_principal) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Manage Qard Hasanah"
        subtitle="Interest-free benevolent micro-financing, zero-interest tracking, and principal ledger"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Interest-Free (0% Riba / Zero Accrual)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {hasPermission('qard_hasanah.repayment') && (
              <Link href="/admin/qard-hasanah/repayment">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <span>Record Repayment</span>
                </Button>
              </Link>
            )}
            {hasPermission('qard_hasanah.create') && (
              <Link href="/admin/qard-hasanah/add">
                <Button size="sm" className="gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Issue Qard Hasanah</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Portfolio Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Principal Disbursed</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalPrincipal)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{totalCount} total loan records</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                <Coins className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Principal Repaid</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalRepaid)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Returned to capital fund</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Outstanding Balance</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalOutstanding)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Principal strictly owed</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Borrowers</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {loans.filter((l) => l.status === 'active' || l.status === 'partially_repaid').length}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">On current page</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="border border-slate-100 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-teal-600" />
                <span>Qard Hasanah Directory</span>
              </CardTitle>

              <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search loan #, purpose..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="partially_repaid">Partially Repaid</option>
                  <option value="fully_repaid">Fully Repaid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <Button type="submit" size="sm" variant="outline" className="text-xs h-8">
                  Filter
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading Qard Hasanah records...</div>
            ) : loans.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <p>No Qard Hasanah loan records found.</p>
                {hasPermission('qard_hasanah.create') && (
                  <Link href="/admin/qard-hasanah/add">
                    <Button size="sm" variant="outline" className="text-xs mt-2">
                      Issue First Qard Hasanah
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Loan ID</th>
                      <th className="py-3 px-4">Borrower</th>
                      <th className="py-3 px-4">Group</th>
                      <th className="py-3 px-4 text-right">Principal</th>
                      <th className="py-3 px-4 text-right">Repaid</th>
                      <th className="py-3 px-4 text-right">Remaining</th>
                      <th className="py-3 px-4">Disbursed</th>
                      <th className="py-3 px-4">Cadence</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {l.loan_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{l.borrower_name || 'Member'}</div>
                          {l.borrower_number && (
                            <div className="text-[10px] text-slate-400 font-mono">{l.borrower_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700">{l.group_name || 'Individual'}</div>
                          {l.group_code && (
                            <div className="text-[10px] text-slate-400 font-mono">{l.group_code}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(l.principal_amount)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                          {formatCurrency(l.total_repaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(l.outstanding_principal)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {l.disbursement_date ? formatDate(l.disbursement_date) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          <div>{l.repayment_schedule}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatCurrency(l.installment_amount)} / inst.
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              l.status === 'fully_repaid'
                                ? 'success'
                                : l.status === 'partially_repaid' || l.status === 'active'
                                ? 'default'
                                : l.status === 'pending'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="capitalize text-[10px]"
                          >
                            {l.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(l)}
                              className="text-[11px] h-7 px-2 gap-1 text-slate-600"
                              title="View Repayment History"
                            >
                              <History className="h-3 w-3" />
                              <span>History</span>
                            </Button>
                            {l.status !== 'fully_repaid' && l.status !== 'cancelled' && hasPermission('qard_hasanah.repayment') && (
                              <Link href={`/admin/qard-hasanah/repayment?loan_id=${l.id}`}>
                                <Button size="sm" className="text-[11px] h-7 px-2.5 bg-teal-700 hover:bg-teal-800 text-white">
                                  Repay
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {page} of {totalPages} ({totalCount} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="text-xs h-7"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="text-xs h-7"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repayment History Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Repayment History: {selectedLoan.loan_number}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Borrower: {selectedLoan.borrower_name} • Principal: {formatCurrency(selectedLoan.principal_amount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Principal</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(selectedLoan.principal_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Repaid</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(selectedLoan.total_repaid)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatCurrency(selectedLoan.outstanding_principal)}
                  </div>
                </div>
              </div>

              {loadingRepayments ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading payment history...</div>
              ) : repayments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No repayments recorded yet for this loan.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Receipt</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {repayments.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">{r.receipt_number}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{formatDate(r.payment_date)}</td>
                          <td className="py-2 px-3 capitalize">{r.payment_method.replace(/_/g, ' ')}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{r.reference || '—'}</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                            {formatCurrency(r.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLoan(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
