import { ShieldCheck, HeartHandshake, Users, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'About Us | Fundo Foundation',
  description: 'Learn about Fundo Foundation, our history, ethical micro-finance model, and governance principles.',
};

export default function AboutPage() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">About Organization</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            A Legacy of Stewardship, Community Solidarity, and Dignified Advancement
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Fundo Foundation was founded to dismantle systemic financial exclusion. By creating community-managed capital pools, we replace predatory borrowing with interest-free revolving funds and verifiable charitable relief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Uncompromising Ethics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We operate under strict Qard Hasan non-interest guidelines. Every dollar in our loan funds circulates endlessly without extracting usurious fees from vulnerable entrepreneurs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Targeted Humanitarian Safety Net</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For beneficiaries unable to engage in commerce due to age, health, or crisis, our 100% policy-restricted Zakat & Sadaqa pools deliver direct stipends, food baskets, and medical sponsorship.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-slate-200 pt-8 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h3 className="text-lg font-bold text-slate-900">Our Organizational Principles</h3>
          <p>
            1. <strong>Participatory Ownership:</strong> Beneficiaries are not passive recipients. They organize into mutual savings circles, take pride in loan repayment, and nominate community projects.
          </p>
          <p>
            2. <strong>Financial Segregation:</strong> Operating foundation overhead is strictly separated from restricted charitable pools. Donors can verify precisely where their contributions reside.
          </p>
          <p>
            3. <strong>Open Digital Governance:</strong> Our automated platform delivers audited double-entry journal logs, real-time portfolio metrics, and verified beneficiary distribution rosters.
          </p>
        </div>
      </div>
    </div>
  );
}
