import { Target, Compass, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Our Mission | Fundo Foundation',
  description: 'Our mission to eliminate financial vulnerability through sustainable community development.',
};

export default function MissionPage() {
  const pillars = [
    { title: 'Equitable Capital Access', desc: 'Providing interest-free revolving funds to micro-entrepreneurs who lack access to conventional banking.' },
    { title: 'Targeted Charitable Relief', desc: 'Ensuring orphan, widow, and medical aid reach the most vulnerable with zero administrative deduction.' },
    { title: 'Community Wealth Building', desc: 'Fostering collective savings pools and mutual accountability structures that endure for decades.' },
    { title: 'Radical Financial Transparency', desc: 'Publishing audited double-entry balance sheets and open transaction records for every fund.' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <Target className="h-3.5 w-3.5 text-teal-700" />
            <span>Mission & Commitment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Fostering Self-Reliance, Economic Freedom, and Social Dignity
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Our mission is to eliminate systemic poverty by empowering underserved communities with ethical capital tools, transparent philanthropic support, and durable community-governed institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((p, idx) => (
            <Card key={idx}>
              <CardContent className="p-6 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
