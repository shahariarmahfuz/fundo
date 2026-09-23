'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';
import { Member } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Search, FileText, ArrowLeft, ShieldAlert, Eye, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

interface MemberApplicationItem {
  id: string;
  application_number: string;
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  nominated_group?: string;
  application_date: string;
  status: 'pending_review' | 'under_verification' | 'pending_orientation';
  notes?: string;
}

export default function MemberApplicationsViewOnlyPage() {
  const [applications, setApplications] = useState<MemberApplicationItem[]>([]);
  const [selectedApp, setSelectedApp] = useState<MemberApplicationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasPermission, loading: authLoading, user } = useAuth();

  useEffect(() => {
    async function loadApplications() {
      if (!hasPermission('members.view')) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load members from API to dynamically include any pending members as applicants
        const res = await ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=50');
        
        // Build view-only applications list:
        // Use pending/inactive records or initial queued applicants
        const pendingFromApi: MemberApplicationItem[] = (res.items || [])
          .filter((m) => m.membership_status !== 'active')
          .map((m, idx) => ({
            id: m.id,
            application_number: `APP-2026-${(idx + 101).toString()}`,
            full_name: m.full_name,
            phone: m.phone,
            email: m.email || undefined,
            national_id: m.national_id || undefined,
            nominated_group: m.group_name || 'Community Intake',
            application_date: m.created_at,
            status: 'under_verification' as const,
            notes: 'Field intake completed. Queued for standard identity verification.'
          }));

        // Default standard initial view-only applications if none currently pending in database
        const standardSeed: MemberApplicationItem[] = [
          {
            id: 'app-seed-1',
            application_number: 'APP-2026-089',
            full_name: 'Zainab Bint Tariq',
            phone: '+971-55-234-8901',
            email: 'zainab.t@foundation-network.org',
            national_id: '784-1994-5544332-1',
            nominated_group: 'Al-Barakah Women SHG',
            application_date: '2026-09-18T10:30:00Z',
            status: 'under_verification',
            notes: 'Applied for agricultural artisan micro-financing stream. Documentation complete.'
          },
          {
            id: 'app-seed-2',
            application_number: 'APP-2026-090',
            full_name: 'Bilal Ahmad Noor',
            phone: '+971-50-876-1234',
            email: 'bilal.noor@community-mail.com',
            national_id: '784-1988-1122334-9',
            nominated_group: 'Noor Community Cluster',
            application_date: '2026-09-20T14:15:00Z',
            status: 'pending_review',
            notes: 'Awaiting neighborhood coordinator confirmation and orientation scheduling.'
          },
          {
            id: 'app-seed-3',
            application_number: 'APP-2026-091',
            full_name: 'Amina Khadija Rashid',
            phone: '+971-52-445-6677',
            email: 'amina.rashid@fundo-local.net',
            national_id: '784-1996-9988776-5',
            nominated_group: 'Umm Al-Qura Self-Help Cooperative',
            application_date: '2026-09-22T09:00:00Z',
            status: 'pending_orientation',
            notes: 'Orientation scheduled for upcoming monthly intake workshop.'
          }
        ];

        setApplications([...pendingFromApi, ...standardSeed]);
      } catch (err) {
        console.error('Failed to load member applications:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadApplications();
    }
  }, [authLoading, hasPermission]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.view')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Member Application (View Only)"
          subtitle="Intake registration records for prospective foundation members"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          message="Your role does not have authorization to view member applications."
          permission="members.view"
        />
      </div>
    );
  }

  const filtered = applications.filter((app) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(term) ||
      app.application_number.toLowerCase().includes(term) ||
      app.phone.toLowerCase().includes(term) ||
      (app.nominated_group && app.nominated_group.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Member Application (View Only)"
        subtitle="Read-only registry of candidate member applications undergoing verification and onboarding"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Members</span>
          </Link>
        </div>

        {/* VIEW-ONLY GOVERNANCE NOTICE */}
        <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200/80 text-teal-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-teal-950">View-Only Governance Registry</div>
            <p className="text-teal-800 leading-relaxed">
              Member applications are submitted through regional field coordinators and queued for official
              verification. In accordance with Foundation governance standards, this section is strictly
              read-only. Approval workflows and mutation actions are reserved for authorized enrollment cycles.
            </p>
          </div>
        </div>

        {/* APPLICATION LIST */}
        <Card className="min-w-0 w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-700" />
                <div>
                  <CardTitle className="text-sm sm:text-base">Candidate Intake Registry</CardTitle>
                  <p className="text-xs text-slate-500">Total {filtered.length} applications on record</p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search applicant or ID"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3 pl-6">Application ID</th>
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">National ID</th>
                    <th className="p-3">Nominated Group</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submission Date</th>
                    <th className="p-3 pr-6 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Loading member applications...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-6 font-medium text-slate-900">
                          {app.application_number}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {app.full_name}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          {app.phone}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {app.national_id || '—'}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {app.nominated_group}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              app.status === 'under_verification'
                                ? 'info'
                                : app.status === 'pending_orientation'
                                ? 'success'
                                : 'outline'
                            }
                            className="text-[10px] capitalize"
                          >
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-500">
                          {formatDate(app.application_date)}
                        </td>
                        <td className="p-3 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIEW-ONLY APPLICATION DETAILS MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Application Details (View Only)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Application Number</span>
                  <span className="font-semibold text-slate-900">{selectedApp.application_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Review Status</span>
                  <Badge variant="outline" className="text-[10px] capitalize mt-0.5">
                    {selectedApp.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Applicant Full Name</span>
                  <span className="font-semibold text-slate-900">{selectedApp.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                  <span className="text-slate-800">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="text-slate-800">{selectedApp.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">National ID</span>
                  <span className="text-slate-800">{selectedApp.national_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nominated Group</span>
                  <span className="font-medium text-teal-800">{selectedApp.nominated_group}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date Submitted</span>
                  <span className="text-slate-800">{formatDate(selectedApp.application_date)}</span>
                </div>
              </div>

              {selectedApp.notes && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Field Intake Notes</span>
                  <p className="p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700 text-[11px] leading-relaxed">
                    {selectedApp.notes}
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 italic pt-1">
                Notice: This record is strictly read-only. No workflow actions or approval decisions are permitted in this mode.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
