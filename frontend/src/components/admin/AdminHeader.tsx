'use client';

import { Bell, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  userRole?: string;
}

export function AdminHeader({ title, subtitle, userRole = 'Super Admin' }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="info" className="gap-1 font-normal">
          <ShieldCheck className="h-3 w-3 text-teal-700" />
          <span>{userRole}</span>
        </Badge>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-slate-800">Foundation Staff</div>
            <div className="text-[10px] text-slate-400">admin@fundo.org</div>
          </div>
        </div>
      </div>
    </header>
  );
}
