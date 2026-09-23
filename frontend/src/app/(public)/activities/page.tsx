import { Layers, Activity, Users, BookOpen, Stethoscope, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Activities & Field Operations | Fundo Foundation',
  description: 'Grassroots programs, community savings circles, and humanitarian distributions.',
};

export default function ActivitiesPage() {
  const activities = [
    {
      title: 'Community Circle Meetings',
      icon: Users,
      desc: 'Weekly and monthly savings meetings where member groups review contribution balances, approve peer loan applications, and exchange business ideas.'
    },
    {
      title: 'Vocational & Financial Literacy Training',
      icon: BookOpen,
      desc: 'Free enterprise development bootcamps teaching inventory bookkeeping, micro-credit management, digital invoicing, and marketing.'
    },
    {
      title: 'Emergency Medical & Food Relief',
      icon: Stethoscope,
      desc: 'Rapid disbursement of Sadaqa and Zakat grants directly to families experiencing acute health crises or seasonal food insecurity.'
    },
    {
      title: 'Clean Water Infrastructure Engineering',
      icon: Droplets,
      desc: 'Geological surveys, deep borehole drilling, and solar pumping installations operated and maintained by trained local water committees.'
    }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">What We Do</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Active Community Programs & Field Interventions
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
            Our daily operations combine disciplined micro-finance circle facilitation with proactive humanitarian field interventions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((a, idx) => {
            const Icon = a.icon;
            return (
              <Card key={idx} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
