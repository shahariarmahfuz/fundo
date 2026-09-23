'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { LedgerEntry } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminLedgersPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!hasPermission('finance.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await ApiClient.get<PaginatedResponse<LedgerEntry>>('/finance/ledgers?page=1&page_size=50');
        setLedgers(res.items);
      } catch (err) {
        console.error('Failed to load ledgers:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, hasPermission]);

  if (!authLoading && !hasPermission('finance.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Double-Entry Accounting Journal"
          subtitle="Chart of accounts and general ledger entries"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="finance.view"
          message="You do not have authorization to view the general ledger journal."
        />
      </div>
    );
  }

  const totalDebits = ledgers.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = ledgers.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Double-Entry Accounting Journal"
        subtitle="Chart of accounts, general ledger entries, and debits & credits balance verification"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        {/* SUMMARY BALANCE BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-white border border-slate-200 gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">
                {isBalanced ? 'Journal Trial Balance: Balanced' : 'Trial Balance: Variance Detected'}
              </div>
              <div className="text-[11px] text-slate-500">
                All financial events post balanced debits and credits automatically
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
            <div>
              <span className="text-slate-400">Total Debits: </span>
              <span className="font-bold text-slate-900">{formatCurrency(totalDebits)}</span>
            </div>
            <div>
              <span className="text-slate-400">Total Credits: </span>
              <span className="font-bold text-slate-900">{formatCurrency(totalCredits)}</span>
            </div>
          </div>
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Journal Ref</th>
                    <th className="p-3">Acct Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                    <th className="p-3 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading journal entries...
                      </td>
                    </tr>
                  ) : ledgers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No ledger entries found.
                      </td>
                    </tr>
                  ) : (
                    ledgers.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-medium text-slate-900">
                          {l.entry_number}
                        </td>
                        <td className="p-3 text-[11px] text-teal-800 font-semibold">
                          {l.account_code}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {l.account_name}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {l.account_type}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {l.description}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-900">
                          {Number(l.debit) > 0 ? formatCurrency(l.debit) : '—'}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-900">
                          {Number(l.credit) > 0 ? formatCurrency(l.credit) : '—'}
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500 text-[11px]">
                          {formatDate(l.entry_date)}
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
