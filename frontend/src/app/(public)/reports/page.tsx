import { FileText, Download, ShieldCheck, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Statutory Reports & Impact Audits | Fundo Foundation',
  description: 'Download audited financial statements, tax filings, and programmatic evaluations.',
};

export default function ReportsPage() {
  const reports = [
    { title: 'Q3 2026 Comprehensive Financial Audit Statement', type: 'External Audit', size: '2.4 MB', date: 'Sep 2026', auditor: 'Deloitte & Touche LLP' },
    { title: 'Q2 2026 Quarterly Performance & Loan Portfolio Review', type: 'Portfolio Report', size: '1.8 MB', date: 'Jun 2026', auditor: 'Internal Audit Committee' },
    { title: 'Annual Impact Evaluation & Beneficiary Census 2025', type: 'Annual Report', size: '6.5 MB', date: 'Jan 2026', auditor: 'Third-Party Evaluators' },
    { title: 'IRS Form 990 Public Disclosure & Tax Exemption Returns', type: 'Statutory Filing', size: '1.2 MB', date: 'Nov 2025', auditor: 'Public Regulatory Registry' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Financial Disclosures</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Official Audits, Statutory Filings & Evaluations
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            All our statutory financial reports and third-party independent audits are made available for unrestricted public scrutiny.
          </p>
        </div>

        <div className="space-y-4">
          {reports.map((rep, idx) => (
            <Card key={idx} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {rep.type}
                    </Badge>
                    <span className="text-xs text-slate-400">• {rep.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                  <div className="text-xs text-slate-500">
                    Certified by {rep.auditor} • PDF ({rep.size})
                  </div>
                </div>

                <div className="shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5 border-slate-300">
                    <Download className="h-3.5 w-3.5 text-teal-700" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
