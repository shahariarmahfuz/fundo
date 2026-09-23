'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface AccessDeniedProps {
  permission?: string;
  message?: string;
}

export function AccessDenied({
  permission,
  message = 'You do not have permission to view this section or perform this operation.'
}: AccessDeniedProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 text-center shadow-xs space-y-4">
        <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Access Denied (403 Forbidden)</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
          {permission && (
            <p className="text-[11px] text-slate-400 font-mono pt-1">
              Required Permission: <span className="text-rose-600 font-semibold">{permission}</span>
            </p>
          )}
        </div>
        <div className="pt-2">
          <Link href="/admin">
            <Button variant="outline" className="text-xs">
              Return to Authorized Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
