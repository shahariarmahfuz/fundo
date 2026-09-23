import { PublicLeadership } from '@/types/public';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, User } from 'lucide-react';

export const metadata = {
  title: 'People & Leadership | Fundo Foundation',
  description: 'Meet our Board of Directors, Executive Leadership, and field supervisors.',
};

async function getLeadership(): Promise<PublicLeadership[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${API_URL}/public/leadership`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function PeoplePage() {
  const leaders = await getLeadership();

  return (
    <div className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Governance & Team</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Fiduciary Leadership & Field Stewards
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Our board and executive team combine decades of expertise in international development, Islamic jurisprudence, statutory accounting, and grassroots community organizing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaders.map((leader) => (
            <Card key={leader.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] uppercase mb-1">
                    {leader.category}
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900">{leader.name}</h3>
                  <div className="text-xs font-medium text-teal-700">{leader.role_title}</div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {leader.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
