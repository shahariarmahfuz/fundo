import { BookOpen, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Insights & Blog | Fundo Foundation',
  description: 'Perspectives on ethical finance, community solidarity, and non-profit governance.',
};

export default function BlogPage() {
  const articles = [
    {
      title: 'Why Zero-Interest Micro-Financing Outperforms Traditional Micro-Debt',
      author: 'Dr. Amina Rahman',
      date: 'Sep 15, 2026',
      readTime: '6 min read',
      excerpt: 'Conventional micro-credit systems frequently charge upwards of 30% APR, trapping borrowers in compounding cycles. Here is how mutual revolving pools maintain a 99.4% repayment rate without usury.',
      tag: 'Micro-Finance Theory'
    },
    {
      title: 'The Jurisprudence of Digital Zakat: Segregation and Verifiability',
      author: 'Tariq Mansoor, CPA',
      date: 'Aug 22, 2026',
      readTime: '8 min read',
      excerpt: 'Ensuring that 100% of designated Zakat funds reach qualified Asnaf categories without absorption into non-profit marketing or administration costs.',
      tag: 'Islamic Jurisprudence'
    },
    {
      title: 'Decentralized Community Oversight in Rural Water Management',
      author: 'Dr. Fatima Al-Hassan',
      date: 'Jul 30, 2026',
      readTime: '5 min read',
      excerpt: 'Lessons from 40 solar borehole installations where village-led maintenance committees maintain 100% operational uptime over five continuous years.',
      tag: 'Field Operations'
    }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Perspectives</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Insights on Ethical Finance & Social Stewardship
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Thought leadership and analytical articles written by our leadership, field economists, and governance researchers.
          </p>
        </div>

        <div className="space-y-6">
          {articles.map((art, idx) => (
            <Card key={idx} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <Badge variant="outline" className="text-[10px]">
                    {art.tag}
                  </Badge>
                  <span>{art.readTime}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {art.excerpt}
                </p>

                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <User className="h-3.5 w-3.5 text-teal-700" />
                    {art.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {art.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
