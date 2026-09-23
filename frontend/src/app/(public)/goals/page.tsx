import { Target, Flag, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Strategic Goals 2026-2030 | Fundo Foundation',
  description: 'Our five-year strategic roadmap and measurable impact milestones.',
};

export default function GoalsPage() {
  const goals = [
    { target: '100,000 Households', metric: 'Economic Empowerment', desc: 'Expand interest-free revolving credit pools across 250 verified community clusters.' },
    { target: '$15,000,000 Capital Deployed', metric: 'Zero-Interest Lending', desc: 'Deploy philanthropic and endowment capital with audited 99%+ historical repayment cycles.' },
    { target: '10,000 Orphan Scholarships', metric: 'Educational Pipeline', desc: 'Fully fund primary through university technical training for parentless children.' },
    { target: '100 Solar Water Wells', metric: 'Critical Infrastructure', desc: 'Deliver sustainable aquifer-fed safe drinking water to over 300,000 rural residents.' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <Flag className="h-3.5 w-3.5 text-teal-700" />
            <span>Roadmap & Milestones</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Strategic Roadmap: 2026 – 2030 Milestones
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Every target is rigorously measured, independently audited, and reported quarterly to our donors and community beneficiaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g, idx) => (
            <Card key={idx}>
              <CardContent className="p-6 space-y-2">
                <div className="text-xs font-semibold uppercase text-teal-700 tracking-wider">
                  {g.metric}
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {g.target}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {g.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
