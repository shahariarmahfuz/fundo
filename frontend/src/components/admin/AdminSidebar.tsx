'use client';

import { useState, useEffect } from 'react';
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
  UserCog,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminNav } from '@/context/AdminNavContext';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permission?: string;
}

interface SubmenuItem {
  href: string;
  label: string;
  permission?: string;
  exact?: boolean;
}

const memberSubmenuItems: SubmenuItem[] = [
  { href: '/admin/members/add', label: 'Add Member', permission: 'members.create' },
  { href: '/admin/members', label: 'Manage Member', permission: 'members.view', exact: true },
  { href: '/admin/members/applications', label: 'Member Applications', permission: 'member_applications.view' },
  { href: '/admin/members/due-list', label: 'Member Due List', permission: 'members.view' },
  { href: '/admin/members/ledger', label: 'Member Ledger', permission: 'members.view' },
];

const beneficiarySubmenuItems: SubmenuItem[] = [
  { href: '/admin/beneficiaries/add', label: 'Add Beneficiary', permission: 'beneficiaries.create' },
  { href: '/admin/beneficiaries', label: 'Manage Beneficiary', permission: 'beneficiaries.view', exact: true },
  { href: '/admin/beneficiaries/ledger', label: 'Beneficiary Ledger', permission: 'beneficiaries.view' },
];

const groupSubmenuItems: SubmenuItem[] = [
  { href: '/admin/groups/add', label: 'Add Group', permission: 'groups.create' },
  { href: '/admin/groups', label: 'Manage Group', permission: 'groups.view', exact: true },
  { href: '/admin/groups/fund', label: 'Group Fund', permission: 'groups.view' },
  { href: '/admin/groups/members', label: 'Group Members', permission: 'groups.view' },
  { href: '/admin/groups/ledger', label: 'Group Ledger', permission: 'groups.view' },
];

const contributionSubmenuItems: SubmenuItem[] = [
  { href: '/admin/contributions/add', label: 'Add Contribution', permission: 'contributions.create' },
  { href: '/admin/contributions', label: 'Manage Contribution', permission: 'contributions.view', exact: true },
  { href: '/admin/contributions/summary', label: 'Contribution Summary', permission: 'contributions.view' },
  { href: '/admin/contributions/report', label: 'Contribution Report', permission: 'contributions.view' },
];

const qardHasanahSubmenuItems: SubmenuItem[] = [
  { href: '/admin/qard-hasanah/add', label: 'Add Qard Hasanah', permission: 'qard_hasanah.create' },
  { href: '/admin/qard-hasanah', label: 'Manage Qard Hasanah', permission: 'qard_hasanah.view', exact: true },
  { href: '/admin/qard-hasanah/reports', label: 'Qard Hasanah Reports', permission: 'qard_hasanah.reports' },
  { href: '/admin/qard-hasanah/repayment', label: 'Qard Hasanah Repayment', permission: 'qard_hasanah.repayment' },
];

const sadaqaSubmenuItems: SubmenuItem[] = [
  { href: '/admin/sadaqa/add', label: 'Add Sadaqa', permission: 'sadaqa.create' },
  { href: '/admin/sadaqa', label: 'Manage Sadaqa', permission: 'sadaqa.view', exact: true },
  { href: '/admin/sadaqa/reports', label: 'Sadaqa Report', permission: 'sadaqa.reports' },
];

const standardNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  // High-level modules ('Member', 'Beneficiary', 'Group', 'Contribution', 'Qard Hasanah', 'Sadaqa / Donations') are rendered above as dedicated expandable sections
  { href: '/admin/users', label: 'Users & Roles', icon: UserCog, permission: 'users.view' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useAdminNav();
  const { user, hasPermission, isSuperAdmin, logout } = useAuth();

  const isMemberRoute = pathname.startsWith('/admin/members');
  // Default state on initial load: closed by default unless current active route is already within this section
  const [isMemberExpanded, setIsMemberExpanded] = useState<boolean>(() => isMemberRoute);

  const isBeneficiaryRoute = pathname.startsWith('/admin/beneficiaries');
  const [isBeneficiaryExpanded, setIsBeneficiaryExpanded] = useState<boolean>(() => isBeneficiaryRoute);

  const isGroupRoute = pathname.startsWith('/admin/groups');
  const [isGroupExpanded, setIsGroupExpanded] = useState<boolean>(() => isGroupRoute);

  const isContributionRoute = pathname.startsWith('/admin/contributions');
  const [isContributionExpanded, setIsContributionExpanded] = useState<boolean>(() => isContributionRoute);

  const isQardHasanahRoute = pathname.startsWith('/admin/qard-hasanah');
  const [isQardHasanahExpanded, setIsQardHasanahExpanded] = useState<boolean>(() => isQardHasanahRoute);

  const isSadaqaRoute = pathname.startsWith('/admin/sadaqa') || pathname.startsWith('/admin/donations');
  const [isSadaqaExpanded, setIsSadaqaExpanded] = useState<boolean>(() => isSadaqaRoute);

  useEffect(() => {
    if (pathname.startsWith('/admin/members')) {
      setIsMemberExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/admin/beneficiaries')) {
      setIsBeneficiaryExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/admin/groups')) {
      setIsGroupExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/admin/contributions')) {
      setIsContributionExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/admin/qard-hasanah')) {
      setIsQardHasanahExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/admin/sadaqa') || pathname.startsWith('/admin/donations')) {
      setIsSadaqaExpanded(true);
    }
  }, [pathname]);

  if (pathname === '/login' || pathname === '/admin/login') {
    return null;
  }

  const canViewMembers = !user || isSuperAdmin || hasPermission('members.view') || hasPermission('member_applications.view');
  const canViewBeneficiaries = !user || isSuperAdmin || hasPermission('beneficiaries.view');
  const canViewGroups = !user || isSuperAdmin || hasPermission('groups.view');
  const canViewContributions = !user || isSuperAdmin || hasPermission('contributions.view');
  const canViewQardHasanah = !user || isSuperAdmin || hasPermission('qard_hasanah.view');
  const canViewSadaqa = !user || isSuperAdmin || hasPermission('sadaqa.view') || hasPermission('donations.view');

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  const toggleMemberMenu = () => {
    setIsMemberExpanded((prev) => !prev);
  };

  const toggleBeneficiaryMenu = () => {
    setIsBeneficiaryExpanded((prev) => !prev);
  };

  const toggleGroupMenu = () => {
    setIsGroupExpanded((prev) => !prev);
  };

  const toggleContributionMenu = () => {
    setIsContributionExpanded((prev) => !prev);
  };

  const toggleQardHasanahMenu = () => {
    setIsQardHasanahExpanded((prev) => !prev);
  };

  const toggleSadaqaMenu = () => {
    setIsSadaqaExpanded((prev) => !prev);
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

          {/* 1. Dashboard Link */}
          {(() => {
            const isDashboardActive = pathname === '/admin';
            return (
              <Link
                href="/admin"
                onClick={closeSidebar}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                  isDashboardActive
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className={cn("h-4 w-4", isDashboardActive ? "text-teal-700" : "text-slate-400")} />
                  <span>Dashboard</span>
                </div>
                {isDashboardActive && <ChevronRight className="h-3 w-3 text-teal-700" />}
              </Link>
            );
          })()}

          {/* 2. Expandable Member Parent Menu */}
          {canViewMembers && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleMemberMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isMemberRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isMemberExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={cn("h-4 w-4", isMemberRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Member</span>
                </div>
                {isMemberExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isMemberExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {memberSubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission)) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/members' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Expandable Beneficiary Parent Menu */}
          {canViewBeneficiaries && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleBeneficiaryMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isBeneficiaryRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isBeneficiaryExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className={cn("h-4 w-4", isBeneficiaryRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Beneficiary</span>
                </div>
                {isBeneficiaryExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isBeneficiaryExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {beneficiarySubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission)) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/beneficiaries' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Expandable Group Parent Menu */}
          {canViewGroups && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleGroupMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isGroupRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isGroupExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <Network className={cn("h-4 w-4", isGroupRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Group</span>
                </div>
                {isGroupExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isGroupExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {groupSubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission)) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/groups' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. Expandable Contribution Parent Menu */}
          {canViewContributions && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleContributionMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isContributionRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isContributionExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <PiggyBank className={cn("h-4 w-4", isContributionRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Contribution</span>
                </div>
                {isContributionExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isContributionExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {contributionSubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission)) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/contributions' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. Expandable Qard Hasanah Parent Menu */}
          {canViewQardHasanah && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleQardHasanahMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isQardHasanahRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isQardHasanahExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className={cn("h-4 w-4", isQardHasanahRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Qard Hasanah</span>
                </div>
                {isQardHasanahExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isQardHasanahExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {qardHasanahSubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission)) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/qard-hasanah' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 7. Expandable Sadaqa / Donations Parent Menu */}
          {canViewSadaqa && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleSadaqaMenu}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isSadaqaRoute
                    ? "bg-teal-50/70 text-teal-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                aria-expanded={isSadaqaExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <HandHeart className={cn("h-4 w-4", isSadaqaRoute ? "text-teal-700" : "text-slate-400")} />
                  <span>Sadaqa / Donations</span>
                </div>
                {isSadaqaExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-teal-700 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
                )}
              </button>

              {/* Collapsible Submenu */}
              {isSadaqaExpanded && (
                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-1">
                  {sadaqaSubmenuItems.map((subItem) => {
                    if (user && subItem.permission && !isSuperAdmin && !hasPermission(subItem.permission) && !hasPermission('donations.view')) {
                      return null;
                    }
                    const isSubActive = subItem.exact
                      ? pathname === subItem.href
                      : pathname === subItem.href || (subItem.href !== '/admin/sadaqa' && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={closeSidebar}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors",
                          isSubActive
                            ? "bg-teal-50 text-teal-800 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span className="truncate">{subItem.label}</span>
                        {isSubActive && <div className="h-1.5 w-1.5 rounded-full bg-teal-700 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 8. Remaining Foundation Modules */}
          {standardNavItems.slice(1).map((item) => {
            if (user && item.permission && !isSuperAdmin && !hasPermission(item.permission)) {
              return null;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
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

        {/* User Info & Footer */}
        <div className="p-3 border-t border-slate-200 space-y-1 shrink-0">
          {user && (
            <div className="px-3 py-2 bg-slate-50 rounded-md border border-slate-100 mb-2">
              <div className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</div>
              <div className="text-[10px] text-teal-700 capitalize font-medium">{user.role?.replace('_', ' ')}</div>
            </div>
          )}
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
