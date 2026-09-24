'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ShieldCheck,
  User,
  HeartHandshake,
  ChevronDown,
  UserCog,
  KeyRound,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAdminNav } from '@/context/AdminNavContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  userRole?: string;
}

export function AdminHeader({ title, subtitle, userRole = 'Super Admin' }: AdminHeaderProps) {
  const { openSidebar } = useAdminNav();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const displayName = user?.full_name || 'Foundation Staff';
  const displayEmail = user?.email || 'admin@fundo.org';
  const roleName = user?.is_superadmin
    ? 'Super Admin'
    : user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')
    : userRole;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'A';

  return (
    <header className="h-16 lg:h-20 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 w-full min-w-0">
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
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
          <h1 className="text-sm sm:text-lg md:text-xl lg:text-[26px] font-bold text-slate-900 tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs md:text-sm lg:text-[14.5px] text-slate-500 hidden sm:block truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Header Actions / User Status */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Badge variant="info" className="gap-1.5 font-normal text-[10px] sm:text-xs py-1 px-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
          <span>{roleName}</span>
        </Badge>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Dropdown Button & Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1 text-left"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            {user?.avatar_url ? (
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-teal-600 shadow-2xs"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
            ) : (
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 relative">
                {initials}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs sm:text-[13.5px] font-semibold text-slate-800 leading-tight max-w-[150px] truncate">
                {displayName}
              </div>
              <div className="text-[10px] sm:text-[12px] text-slate-400 max-w-[150px] truncate">
                {displayEmail}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 transition-transform duration-200 hidden md:block',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* User Info Header */}
              <div className="px-3 py-2.5 bg-slate-50/80 rounded-lg border border-slate-100 mb-1.5">
                <div className="flex items-center gap-2.5">
                  {user?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.avatar_url}
                      alt={displayName}
                      className="h-9 w-9 rounded-full object-cover border border-teal-600 shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {displayEmail}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="info" className="py-0 px-1.5 text-[9px] font-normal leading-tight">
                        {roleName}
                      </Badge>
                      <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-0.5 py-1">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  role="menuitem"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/admin/profile?tab=manage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  role="menuitem"
                >
                  <UserCog className="h-4 w-4 text-slate-500" />
                  <span>Manage Profile</span>
                </Link>
                <Link
                  href="/admin/profile?tab=password"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  role="menuitem"
                >
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <span>Change Password</span>
                </Link>
                <Link
                  href="/admin/profile?tab=preferences"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  role="menuitem"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  <span>Preferences</span>
                </Link>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors text-left"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
