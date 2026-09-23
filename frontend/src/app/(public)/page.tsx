import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Coins,
  HeartHandshake,
  Users,
  CheckCircle2,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { PublicProject } from '@/types/public';

async function getPublicHomeData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const [sectionsRes, projectsRes] = await Promise.all([
      fetch(`${API_URL}/public/sections`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/public/projects?featured_only=true`, { next: { revalidate: 60 } })
    ]);

    const sections = sectionsRes.ok ? await sectionsRes.json() : {};
    const projects: PublicProject[] = projectsRes.ok ? await projectsRes.json() : [];
    return { sections, projects };
  } catch (err) {
    console.error('Error loading public homepage data:', err);
    return { sections: {}, projects: [] };
  }
}

export default async function HomePage() {
  const { sections, projects } = await getPublicHomeData();
  const hero = sections['hero'] || {
    title: 'Empowering Communities Through Transparent & Sustainable Action',
    subtitle: 'Fundo Foundation pioneers ethical micro-financing, community-driven development, and verifiable charitable impact.',
    metadata_json: {
      stats: [
        { label: 'Direct Beneficiaries', value: '48,500+' },
        { label: 'Capital Deployed', value: '$4.2M' },
        { label: 'Community Groups', value: '120+' },
        { label: 'Repayment Success', value: '99.4%' }
      ]
    }
  };

  const stats = hero.metadata_json?.stats || [
    { label: 'Direct Beneficiaries', value: '48,500+' },
    { label: 'Capital Deployed', value: '$4.2M' },
    { label: 'Community Groups', value: '120+' },
    { label: 'Repayment Success', value: '99.4%' }
  ];

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              <span>Verified 100% Policy Transparency</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {hero.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/projects">
                <Button size="lg" className="gap-2">
                  <span>Explore Active Projects</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/transparency">
                <Button variant="outline" size="lg" className="border-slate-300">
                  <span>View Open Ledgers</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* STATS STRIP */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((st: any, idx: number) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
              >
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-teal-800">
                  {st.value}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THREE PILLARS SECTION */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Our Core Model
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              Dignity Over Dependency
            </h3>
            <p className="text-sm text-slate-600">
              We combine revolving zero-interest loan pools with targeted charitable assistance, ensuring every community member ascends to economic self-reliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                  <Coins className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Qard Hasan Micro-Financing</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  100% interest-free revolving loans for artisans, women cooperatives, and small agricultural ventures. Repaid capital returns directly to the pool to fund the next member.
                </p>
                <div className="pt-2">
                  <Link href="/activities" className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                    Learn about loan circles <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Dedicated Sadaqa & Zakat</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strictly segregated charitable funds. Zero overhead deducted from designated humanitarian emergency aid, orphan education stipends, and medical sponsorships.
                </p>
                <div className="pt-2">
                  <Link href="/beneficiaries" className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                    View beneficiary oversight <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Community Governance</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Local groups and clusters make priority investment decisions. Members participate in regular circle meetings, peer accountability, and vocational workshops.
                </p>
                <div className="pt-2">
                  <Link href="/about" className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                    Read governance structure <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Current Initiatives</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">Featured Projects</h3>
            </div>
            <Link href="/projects" className="mt-4 sm:mt-0 text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              <span>View all projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((proj) => {
                const percent = Math.min(100, Math.round((proj.raised_amount / (proj.target_amount || 1)) * 100));
                return (
                  <Card key={proj.id} className="overflow-hidden hover:border-slate-300 transition-colors flex flex-col">
                    <div className="p-5 flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {proj.category}
                        </Badge>
                        <Badge variant={proj.status === 'completed' ? 'success' : 'info'} className="text-[10px]">
                          {proj.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>

                      <div className="pt-2 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-900 font-bold">{formatCurrency(proj.raised_amount)}</span>
                          <span className="text-slate-400">Target {formatCurrency(proj.target_amount)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-teal-700 h-2 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 text-right">
                          {percent}% funded • {proj.beneficiary_count.toLocaleString()} beneficiaries
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 text-xs text-slate-400">
                No featured projects currently listed.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRANSPARENCY BANNER */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                <FileCheck className="h-4 w-4 text-teal-700" />
                <span>Audited Financial Governance</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Zero Hidden Costs. 100% Verifiable Accounting.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We believe trust is earned through radical transparency. Inspect our real-time revolving loan repayment performance, fund balances, and certified audit records.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/transparency">
                <Button size="md" className="gap-2">
                  <span>Explore Live Ledgers</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="md" className="border-slate-300">
                  <span>Annual Reports</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
