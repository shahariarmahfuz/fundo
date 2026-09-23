import { PublicProject } from '@/types/public';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Users, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Active Projects | Fundo Foundation',
  description: 'Explore active foundation initiatives in water, education, micro-enterprises, and emergency aid.',
};

async function getProjects(): Promise<PublicProject[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${API_URL}/public/projects`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Project Directory</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Active Community Initiatives & Capital Deployments
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Every project listed here is subject to verified Milestone Tracking, open expenditure reconciliation, and direct beneficiary accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((proj) => {
            const percent = Math.min(100, Math.round((proj.raised_amount / (proj.target_amount || 1)) * 100));
            return (
              <Card key={proj.id} className="overflow-hidden hover:border-slate-300 transition-colors flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {proj.category}
                      </Badge>
                      <Badge variant={proj.status === 'completed' ? 'success' : 'info'} className="text-[10px]">
                        {proj.status.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{proj.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-700" />
                        {proj.location}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {proj.beneficiary_count.toLocaleString()} assisted
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-900">{formatCurrency(proj.raised_amount)}</span>
                        <span className="text-slate-400">Target {formatCurrency(proj.target_amount)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-700 h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <Link href={`/contact?subject=Support+${encodeURIComponent(proj.title)}`} className="block">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <HeartHandshake className="h-3.5 w-3.5 text-teal-700" />
                        <span>Sponsor This Initiative</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
