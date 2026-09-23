'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Contribution, Member } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, BookOpen, ArrowLeft, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function MemberLedgerPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission, loading: authLoading, user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!hasPermission('members.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [contribRes, membersRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Contribution>>('/contributions?page=1&page_size=150'),
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=100')
        ]);
        setContributions(contribRes.items || []);
        setMembers(membersRes.items || []);
      } catch (err) {
        console.error('Failed to load member ledger data:', err);
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

  if (!hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Member Ledger"
          subtitle="Member savings passbook and financial contribution ledger"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          message="Your role does not have authorization to view member ledgers."
          permission="members.view"
        />
      </div>
    );
  }

  const filteredEntries = contributions.filter((c) => {
    if (selectedMemberId !== 'all' && c.member_id !== selectedMemberId) {
      return false;
    }
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.member_name?.toLowerCase().includes(term) ||
      c.member_number?.toLowerCase().includes(term) ||
      c.receipt_number?.toLowerCase().includes(term) ||
      c.contribution_type?.toLowerCase().includes(term)
    );
  });

  const totalCredits = filteredEntries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Member Ledger"
        subtitle="Individual passbook entries, monthly savings reconciliation, and member equity records"
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

        {/* LEDGER SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Total Entries Recorded</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {filteredEntries.length} transactions
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Verified journal credits</div>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Cumulative Savings & Equity</span>
            <div className="text-xl sm:text-2xl font-bold text-teal-800 mt-1">
              {formatCurrency(totalCredits)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total member deposits reconciled</div>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">Contributing Enrolled Members</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {members.length} members
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active community accounts</div>
          </Card>
        </div>

        {/* LEDGER FILTER & TABLE */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-700" />
                <div>
                  <CardTitle className="text-sm sm:text-base">Passbook Journal Entries</CardTitle>
                  <p className="text-xs text-slate-500">Chronological member credits and savings deposits</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="all">All Members Ledger</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.member_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search receipt or type"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Receipt #</th>
                    <th className="p-3">Member Info</th>
                    <th className="p-3">Deposit Type</th>
                    <th className="p-3">Fund Pool</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3 text-right">Credit Amount</th>
                    <th className="p-3 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading member ledger entries...
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No ledger entries found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-medium text-slate-900">
                          {entry.receipt_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {entry.member_name}{' '}
                          <span className="font-normal text-slate-400 text-[11px]">
                            ({entry.member_number})
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {entry.contribution_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600">
                          {entry.fund_name || 'General Operations Fund'}
                        </td>
                        <td className="p-3 capitalize text-slate-500">
                          {entry.payment_method.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-right font-bold text-teal-800">
                          +{formatCurrency(entry.amount)}
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500">
                          {formatDate(entry.contribution_date)}
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
