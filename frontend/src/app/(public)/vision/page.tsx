import { Eye, Sparkles, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Our Vision | Fundo Foundation',
  description: 'Our generational vision for resilient, self-governing, and thriving communities.',
};

export default function VisionPage() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <Eye className="h-3.5 w-3.5 text-teal-700" />
            <span>Generational Vision</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            A World of Resilient, Self-Governing Communities Free From Financial Subjugation
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            We envision an interconnected global society where human potential is never constrained by birthplace or lack of collateral, and where communities retain the wealth they generate.
          </p>
        </div>

        <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">The 2035 Horizon</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            By 2035, Fundo Foundation aims to catalyze 500 autonomous community mutuals spanning East Africa, Central Asia, and South Asia. Each mutual will operate on open-source digital infrastructure, maintaining independent revolving capital funds and ensuring zero generational debt traps.
          </p>
        </div>
      </div>
    </div>
  );
}
