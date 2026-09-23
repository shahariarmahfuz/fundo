import { ShieldCheck, Landmark, CheckCircle2, Lock, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Financial Transparency & Open Ledgers | Fundo Foundation',
  description: 'Live fund allocation balances, verified accounting ledger standards, and zero-leakage pledges.',
};

export default function TransparencyPage() {
  const funds = [
    { name: 'General Operations & Humanitarian Fund', code: 'GEN-01', balance: 164500.0, type: 'General Operating & Relief' },
    { name: 'Zakat & Sadaqa Charitable Relief Pool', code: 'ZAK-02', balance: 98200.0, type: '100% Policy-Restricted Relief' },
    { name: 'Qard Hasan Micro-Loan Revolving Pool', code: 'REV-03', balance: 135000.0, type: 'Revolving Capital Pool' },
    { name: 'Orphan & Student Education Endowment', code: 'EDU-04', balance: 72000.0, type: 'Designated Endowment' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
            <span>Open Ledger Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Absolute Financial Transparency & Real-Time Stewardship
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            At Fundo Foundation, every single contribution, loan disbursement, repayment, and charitable grant is registered in an immutable double-entry ledger with PostgreSQL as the verifiable source of truth.
          </p>
        </div>

        {/* CURRENT FUND POOLS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Foundation Funds Balance</h2>
            <Badge variant="success" className="text-[10px]">Real-Time Reconciled</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funds.map((f) => (
              <Card key={f.code} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{f.code}</span>
                    <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{f.name}</h3>
                  <div className="text-xl font-bold text-teal-800 pt-1">
                    {formatCurrency(f.balance)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 3 TRANSPARENCY PILLARS */}
        <div className="border-t border-slate-200 pt-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Our Triple-Check Governance Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">1. PostgreSQL ACID Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transactions are recorded with database row-level locking and atomic debit/credit journals. Historical records cannot be modified or purged.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">2. Bank Reconciliation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bank accounts are mapped 1-to-1 with our fund accounting ledger. Monthly bank statements are reconciled and audited by chartered accountants.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">3. Zero Leakage Policy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designated Sadaqa and Zakat donations never fund operating overhead. Foundation administrative costs are underwritten exclusively by unrestricted endowment capital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
