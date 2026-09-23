'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Network,
  PiggyBank,
  Coins,
  HandHeart,
  Landmark,
  ArrowLeftRight,
  BookOpen,
  BarChart3,
  UserCog,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiClient } from '@/lib/api';
import { useAdminNav } from '@/context/AdminNavContext';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/beneficiaries', label: 'Beneficiaries', icon: HeartHandshake },
  { href: '/admin/groups', label: 'Groups', icon: Network },
  { href: '/admin/contributions', label: 'Contributions', icon: PiggyBank },
  { href: '/admin/loans', label: 'Loans', icon: Coins },
  { href: '/admin/donations', label: 'Sadaqa / Donations', icon: HandHeart },
  { href: '/admin/funds', label: 'Funds', icon: Landmark },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/ledgers', label: 'Ledgers', icon: BookOpen },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: UserCog },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useAdminNav();

  if (pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await ApiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    ApiClient.setToken(null);
    closeSidebar();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out",
          // Mobile Drawer Behavior:
          "fixed inset-y-0 left-0 z-50 shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop Static Behavior:
          "lg:static lg:z-auto lg:translate-x-0"
        )}
        aria-label="Management Navigation"
      >
        {/* Brand Bar with Close Button on Mobile */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <Link href="/admin" onClick={closeSidebar} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Fundo Admin</div>
              <div className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">Management System</div>
            </div>
          </Link>

          {/* Close button inside sidebar on mobile */}
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden p-1.5 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Foundation Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-4 w-4", isActive ? "text-teal-700" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3 w-3 text-teal-700" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Shortcut */}
        <div className="p-3 border-t border-slate-200 space-y-1 shrink-0">
          <Link
            href="/"
            target="_blank"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
          >
            <Globe className="h-4 w-4 text-slate-400" />
            <span>Public Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
