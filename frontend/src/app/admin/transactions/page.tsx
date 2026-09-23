'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { FinancialTransaction } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminTransactionsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!hasPermission('finance.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await ApiClient.get<PaginatedResponse<FinancialTransaction>>('/finance/transactions?page=1&page_size=50');
        setTransactions(res.items);
      } catch (err) {
        console.error('Failed to load transactions:', err);
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
          title="Financial Transactions Audit Trail"
          subtitle="Immutable audit log of all fund balance movements"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="finance.view"
          message="You do not have authorization to view financial audit transactions."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Financial Transactions Audit Trail"
        subtitle="Immutable audit log of all fund balance movements, credits, and debits"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" />
            <span>Append-only non-destructive accounting ledger record</span>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            {transactions.length} Logged Entries
          </Badge>
        </div>

        <Card className="min-w-0 w-full overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Tx Number</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Fund</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Balance After</th>
                    <th className="p-3 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading transaction audit trail...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-mono font-medium text-slate-900">
                          {t.transaction_number}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={t.transaction_type === 'credit' ? 'success' : 'destructive'}
                            className="text-[10px] uppercase font-mono"
                          >
                            {t.transaction_type}
                          </Badge>
                        </td>
                        <td className="p-3 capitalize font-medium text-slate-700">
                          {t.category.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-slate-600">
                          {t.fund_name}
                        </td>
                        <td className="p-3 text-slate-600 max-w-sm truncate">
                          {t.description}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {t.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-teal-800">
                          {formatCurrency(t.balance_after)}
                        </td>
                        <td className="p-3 pr-6 text-right text-slate-500 font-mono text-[11px]">
                          {formatDate(t.transaction_date)}
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
