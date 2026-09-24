import Link from 'next/link';
import { HeartHandshake, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Fundo</span>
            <span className="text-[10px] uppercase tracking-wider text-teal-700 font-semibold">Foundation Platform</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/about" className="hover:text-teal-700 transition-colors">About</Link>
          <Link href="/mission" className="hover:text-teal-700 transition-colors">Mission</Link>
          <Link href="/activities" className="hover:text-teal-700 transition-colors">Activities</Link>
          <Link href="/projects" className="hover:text-teal-700 transition-colors">Projects</Link>
          <Link href="/beneficiaries" className="hover:text-teal-700 transition-colors">Beneficiaries</Link>
          <Link href="/stories" className="hover:text-teal-700 transition-colors">Stories</Link>
          <Link href="/news" className="hover:text-teal-700 transition-colors">News</Link>
          <Link href="/transparency" className="hover:text-teal-700 transition-colors">Transparency</Link>
          <Link href="/contact" className="hover:text-teal-700 transition-colors">Contact</Link>
          <Link href="/apply-for-membership" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
            Apply for Membership
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/apply-for-membership">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5 border-teal-600 text-teal-700 hover:bg-teal-50">
              <UserCheck className="h-4 w-4 text-teal-700" />
              <span>Become a Member</span>
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1.5 border-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Staff Portal</span>
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="sm" className="gap-1.5">
              <span>Support Cause</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
