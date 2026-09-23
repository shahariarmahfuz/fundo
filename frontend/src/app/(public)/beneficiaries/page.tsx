import { HeartHandshake, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Beneficiaries & Assistance Directory | Fundo Foundation',
  description: 'Verified criteria, oversight process, and transparent beneficiary aid allocation.',
};

export default function BeneficiariesPublicPage() {
  const categories = [
    { name: 'Widowed Families', assistance: 'Financial Stipends & Vocational Grants', focus: 'Enabling sustainable household self-sufficiency' },
    { name: 'Orphan Care & Education', assistance: 'Full STEM Tuition & Boarding', focus: 'Guaranteed secondary and collegiate completion' },
    { name: 'Individuals with Disabilities', assistance: 'Medical Devices & Home Livelihood Toolkits', focus: 'Accessible, dignified enterprise participation' },
    { name: 'Emergent Crisis Victims', assistance: 'Unrestricted Direct Cash Relief', focus: 'Immediate shelter, food staples, and urgent healthcare' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Beneficiary Oversight</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Dignified Assistance With Verified Eligibility
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Every household receiving direct grants or micro-allocations is vetted by field supervisors in collaboration with local community committees to prevent fraud and ensure aid reaches those most in need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((c, idx) => (
            <Card key={idx}>
              <CardContent className="p-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                  <Badge variant="info" className="text-[10px]">Verified Category</Badge>
                </div>
                <div className="text-xs font-semibold text-teal-700">
                  {c.assistance}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.focus}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-4 text-xs sm:text-sm text-slate-600">
          <h3 className="text-base font-bold text-slate-900">Our 4-Step Verification Protocol</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
              <span><strong>1. Grassroots Nomination:</strong> Community cluster elders submit candidates.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
              <span><strong>2. Field Assessment:</strong> Foundation field staff conduct in-person socio-economic verification.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
              <span><strong>3. Independent Approval:</strong> Compliance officer confirms eligibility against Zakat/Sadaqa charter.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
              <span><strong>4. Audited Disbursement:</strong> Payment tracked via digital receipt and journal entry.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
