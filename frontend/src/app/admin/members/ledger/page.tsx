'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';
import { Member, MemberContributionLedger } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BookOpen,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  PiggyBank,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

function MemberLedgerContent() {
  const searchParams = useSearchParams();
  const { hasPermission, loading: authLoading, user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(searchParams.get('member_id') || '');
  const [ledgerData, setLedgerData] = useState<MemberContributionLedger | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Load all members for dropdown
  useEffect(() => {
    async function loadMembers() {
      if (!hasPermission('members.view')) {
        setLoadingMembers(false);
        return;
      }
      try {
        setLoadingMembers(true);
        const res = await ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=200');
        const list = res.items || [];
        setMembers(list);

        if (!selectedMemberId && list.length > 0) {
          setSelectedMemberId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoadingMembers(false);
      }
    }

    if (!authLoading) {
      loadMembers();
    }
  }, [authLoading, hasPermission]);

  // Load ledger data for the selected member
  useEffect(() => {
    async function fetchLedger() {
      if (!selectedMemberId || !hasPermission('members.view')) {
        return;
      }
      try {
        setLoadingLedger(true);
        const data = await ApiClient.get<MemberContributionLedger>(
          `/contributions/member-ledger/${selectedMemberId}`
        );
        setLedgerData(data);
      } catch (err) {
        console.error('Failed to load member ledger:', err);
      } finally {
        setLoadingLedger(false);
      }
    }

    if (selectedMemberId && !authLoading) {
      fetchLedger();
    }
  }, [selectedMemberId, authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Member Savings Passbook & Ledger"
          subtitle="Individual savings history and monthly dues reconciliation"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="members.view"
          message="Your role does not have authorization to view member ledgers."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
      <AdminHeader
        title="Member Contribution Passbook & Ledger"
        subtitle="Individual monthly expected vs actual savings, dues tracking, and financial transaction audit"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Contributions</span>
          </Link>

          {/* Member Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Select Member:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium h-9"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number}) {m.group_name ? `[${m.group_name}]` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Member Profile & Ledger Summary Header */}
        {ledgerData && (
          <div className="space-y-4">
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{ledgerData.member_name}</h2>
                      <Badge variant="outline" className="font-mono text-xs">
                        {ledgerData.member_number}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-teal-700" />
                        <span>Group: <strong>{ledgerData.group_name || 'No Group'}</strong></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Joined: {formatDate(ledgerData.join_date)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPermission('contributions.create') && (
                      <Link href={`/admin/contributions/add?member_id=${ledgerData.member_id}`}>
                        <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs h-8">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Record Payment</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 3 Metric Cards: Total Expected, Total Paid, Total Due */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Lifetime Expected Base</span>
                    <span className="text-xl font-bold text-slate-800 mt-1 block">
                      {formatCurrency(ledgerData.total_expected)}
                    </span>
                    <span className="text-[11px] text-slate-400">Sum of configured base across active months</span>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-medium block">Total Actually Paid</span>
                    <span className="text-xl font-bold text-emerald-700 mt-1 block">
                      {formatCurrency(ledgerData.total_paid)}
                    </span>
                    <span className="text-[11px] text-emerald-600/80">Credited to member passbook & group fund</span>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-xs text-amber-800 font-medium block">Outstanding Dues</span>
                    <span className={`text-xl font-bold mt-1 block ${ledgerData.total_due > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {formatCurrency(ledgerData.total_due)}
                    </span>
                    <span className="text-[11px] text-amber-700/80">
                      {ledgerData.total_due > 0 ? 'Pending payment collection' : 'All monthly dues fully settled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expected vs Paid Reconciliation Table */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-700" />
                  <span>Monthly Contribution Passbook Breakdown</span>
                </CardTitle>
                <span className="text-xs text-slate-400 font-mono">
                  {ledgerData.monthly_records.length} Accounting Months
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                        <th className="py-3 px-4">Month</th>
                        <th className="py-3 px-4">Expected Base</th>
                        <th className="py-3 px-4">Actual Paid</th>
                        <th className="py-3 px-4">Outstanding Due</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payments Breakdown</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ledgerData.monthly_records.map((rec) => (
                        <tr key={rec.month} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {rec.month}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {formatCurrency(rec.expected_amount)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-700">
                            {formatCurrency(rec.paid_amount)}
                          </td>
                          <td className="py-3 px-4">
                            {rec.due_amount > 0 ? (
                              <span className="font-semibold text-amber-700">
                                {formatCurrency(rec.due_amount)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">৳0.00</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {rec.status === 'paid' && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Fully Paid
                              </Badge>
                            )}
                            {rec.status === 'surplus' && (
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                Surplus Paid
                              </Badge>
                            )}
                            {rec.status === 'partial' && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                Partial Due
                              </Badge>
                            )}
                            {rec.status === 'unpaid' && (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                Unpaid Due
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {rec.payments.length === 0 ? (
                              <span className="text-slate-400 italic">No payments recorded</span>
                            ) : (
                              <div className="space-y-0.5">
                                {rec.payments.map((p) => (
                                  <div key={p.id} className="text-[11px] text-slate-600 flex items-center gap-1.5 font-mono">
                                    <span>{p.receipt_number}</span>
                                    <span className="font-semibold text-slate-800">({formatCurrency(p.amount)})</span>
                                    <span className="text-slate-400 capitalize">{p.payment_method.replace('_', ' ')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {rec.due_amount > 0 && hasPermission('contributions.create') ? (
                              <Link
                                href={`/admin/contributions/add?member_id=${ledgerData.member_id}&month=${rec.month}`}
                              >
                                <Button size="sm" variant="outline" className="text-[11px] h-7 px-2 border-amber-300 text-amber-800 hover:bg-amber-50">
                                  Pay Due
                                </Button>
                              </Link>
                            ) : (
                              <Link
                                href={`/admin/contributions/add?member_id=${ledgerData.member_id}&month=${rec.month}`}
                              >
                                <Button size="sm" variant="ghost" className="text-[11px] h-7 px-2 text-slate-500 hover:text-slate-800">
                                  Add Deposit
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Individual Historical Transactions Table */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-teal-700" />
                  <span>Itemized Financial Transaction Ledger ({ledgerData.transactions.length})</span>
                </CardTitle>
                <span className="text-xs text-slate-400 font-mono">Audit Log</span>
              </CardHeader>
              <CardContent className="p-0">
                {ledgerData.transactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No transactions recorded for this member yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                          <th className="py-3 px-4">Receipt #</th>
                          <th className="py-3 px-4">Month</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Group Credited</th>
                          <th className="py-3 px-4">Payment Method</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Recorded By</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {ledgerData.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">
                              {tx.receipt_number}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              <Badge variant="outline" className="text-[10px]">
                                {tx.contribution_month}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800">{tx.group_name || '—'}</span>
                            </td>
                            <td className="py-3 px-4 capitalize">
                              {tx.payment_method.replace('_', ' ')}
                              {tx.payment_reference && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Ref: {tx.payment_reference}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {formatDate(tx.contribution_date)}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {tx.recorded_by || 'System'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {tx.notes || '—'}
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
        )}
      </div>
    </div>
  );
}

export default function MemberLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading member ledger...</div>}>
      <MemberLedgerContent />
    </Suspense>
  );
}
