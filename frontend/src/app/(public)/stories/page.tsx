import { PublicStory } from '@/types/public';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { BookOpen, User } from 'lucide-react';

export const metadata = {
  title: 'Impact Stories | Fundo Foundation',
  description: 'Grassroots accounts of resilience, transformation, and dignity.',
};

async function getStories(): Promise<PublicStory[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${API_URL}/public/stories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Testimonials</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Stories of Human Flourishing & Self-Reliance
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Real narratives from members and families whose lives have been transformed through ethical micro-capital and community solidarity.
          </p>
        </div>

        <div className="space-y-8">
          {stories.map((story) => (
            <Card key={story.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <Badge variant="outline" className="text-[10px]">
                    {story.category}
                  </Badge>
                  <span>{formatDate(story.published_at)}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {story.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 font-medium italic border-l-2 border-teal-600 pl-4">
                  "{story.summary}"
                </p>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {story.content}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Reported by {story.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
