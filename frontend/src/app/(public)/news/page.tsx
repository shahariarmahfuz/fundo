import { PublicNewsPost } from '@/types/public';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Newspaper, FileText } from 'lucide-react';

export const metadata = {
  title: 'Press & News | Fundo Foundation',
  description: 'Official announcements, field updates, and foundation notices.',
};

async function getNews(): Promise<PublicNewsPost[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${API_URL}/public/news`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Newsroom</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Press Releases, Operational Updates & Notices
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Stay informed on our project expansions, field mission evaluations, and institutional milestones.
          </p>
        </div>

        <div className="space-y-6">
          {news.map((item) => (
            <Card key={item.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {item.post_type}
                  </Badge>
                  <span>{formatDate(item.published_at)}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.excerpt}
                </p>

                <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
