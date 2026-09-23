import { Image as ImageIcon, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Image from 'next/image';

export const metadata = {
  title: 'Field Mission Gallery | Fundo Foundation',
  description: 'Visual documentation of our water projects, artisan collectives, and relief distributions.',
};

export default function GalleryPage() {
  const images = [
    { title: 'Solar Borehole Pumping Facility', location: 'Turkana County', url: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80', tag: 'Water Infrastructure' },
    { title: 'Women Artisan Cooperative Weaving Hub', location: 'Swat Valley', url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80', tag: 'Micro-Enterprise' },
    { title: 'STEM Classroom & Technical Training Center', location: 'Central Academic Campus', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', tag: 'Education' },
    { title: 'Community Savings Circle Consultation', location: 'Eastern Regional District', url: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80', tag: 'Governance' },
    { title: 'Emergency Food Basket Preparation', location: 'Northern Distribution Depots', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80', tag: 'Emergency Relief' },
    { title: 'Agricultural Seed Stock Inspection', location: 'Highland Farming Cooperative', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', tag: 'Sustainable Agriculture' }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Visual Documentation</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Field Mission Photo Gallery
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Photographic verifications from our ongoing field interventions, community meetings, and infrastructure completions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <Card key={idx} className="overflow-hidden hover:border-slate-300 transition-colors">
              <div className="relative h-48 w-full bg-slate-100">
                <Image
                  src={img.url}
                  alt={img.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4 space-y-1.5">
                <div className="text-[10px] uppercase font-semibold text-teal-700 tracking-wider">
                  {img.tag}
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{img.title}</h4>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{img.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
