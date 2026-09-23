'use client';

import { Menu, ShieldCheck, User, HeartHandshake } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAdminNav } from '@/context/AdminNavContext';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  userRole?: string;
}

export function AdminHeader({ title, subtitle, userRole = 'Super Admin' }: AdminHeaderProps) {
  const { openSidebar } = useAdminNav();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 w-full min-w-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={openSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700 shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Mini Branding */}
        <div className="lg:hidden flex items-center gap-1.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-700 text-white shadow-xs">
            <HeartHandshake className="h-4 w-4" />
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="min-w-0">
          <h1 className="text-xs sm:text-base font-semibold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 hidden md:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Header Actions / User Status */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Badge variant="info" className="gap-1 font-normal text-[10px] sm:text-xs py-0.5 px-2">
          <ShieldCheck className="h-3 w-3 text-teal-700 shrink-0" />
          <span>{userRole}</span>
        </Badge>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shrink-0">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-medium text-slate-800 leading-tight">Foundation Staff</div>
            <div className="text-[10px] text-slate-400">admin@fundo.org</div>
          </div>
        </div>
      </div>
    </header>
  );
}
