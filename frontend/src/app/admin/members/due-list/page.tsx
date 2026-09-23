'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Loan } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { Search, CalendarClock, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function MemberDueListPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission, loading: authLoading, user } = useAuth();

  useEffect(() => {
    async function fetchDues() {
      if (!hasPermission('members.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await ApiClient.get<PaginatedResponse<Loan>>('/loans?page=1&page_size=100');
        // Filter loans that have an outstanding balance due
        const dueLoans = (res.items || []).filter((l) => Number(l.outstanding_balance) > 0);
        setLoans(dueLoans);
      } catch (err) {
        console.error('Failed to load member due list:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDues();
    }
  }, [authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Member Due List"
          subtitle="Outstanding member micro-finance dues and scheduled repayments"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          message="Your role does not have authorization to view member dues."
          permission="members.view"
        />
      </div>
    );
  }

  const filteredLoans = loans.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.member_name?.toLowerCase().includes(term) ||
      l.member_number?.toLowerCase().includes(term) ||
      l.loan_number?.toLowerCase().includes(term)
    );
  });

  const totalOutstanding = loans.reduce((acc, curr) => acc + Number(curr.outstanding_balance || 0), 0);
  const totalMonthlyDue = loans.reduce((acc, curr) => acc + Number(curr.monthly_installment || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Member Due List"
        subtitle="Schedule of active loan installments, expected monthly collections, and outstanding member balances"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Members</span>
          </Link>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Active Borrowers with Dues</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {loans.length} members
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assigned to active repayment cycles</div>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Monthly Expected Inflow</span>
            <div className="text-xl sm:text-2xl font-bold text-teal-800 mt-1">
              {formatCurrency(totalMonthlyDue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sum of scheduled monthly installments</div>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Total Outstanding Balance</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Remaining uncollected principal portfolio</div>
          </Card>
        </div>

        {/* DUE LIST TABLE */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base">Scheduled Member Repayments</CardTitle>
                <p className="text-xs text-slate-500">Real-time ledger dues by borrower</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by member or loan #"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Member Number</th>
                    <th className="p-3">Borrower Name</th>
                    <th className="p-3">Loan Reference</th>
                    <th className="p-3 text-right">Monthly Due</th>
                    <th className="p-3 text-right">Outstanding Balance</th>
                    <th className="p-3">Repayment Status</th>
                    <th className="p-3 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading member due records...
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No outstanding member dues found.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-medium text-slate-900">
                          {loan.member_number || 'N/A'}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {loan.member_name}
                        </td>
                        <td className="p-3 text-slate-600">
                          {loan.loan_number}
                        </td>
                        <td className="p-3 text-right font-semibold text-teal-800">
                          {formatCurrency(loan.monthly_installment)} / mo
                        </td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          {formatCurrency(loan.outstanding_balance)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize text-amber-800 border-amber-200 bg-amber-50">
                            Due Active
                          </Badge>
                        </td>
                        <td className="p-3 pr-6 text-right">
                          <Link
                            href={`/admin/loans`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                          >
                            <span>Manage Loan</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
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
