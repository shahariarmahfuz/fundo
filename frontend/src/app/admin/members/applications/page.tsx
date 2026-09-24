'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Check,
  X,
  RefreshCw,
  Users,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertCircle,
  FileText
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AccessDenied } from '@/components/admin/PermissionGuard';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { PaginatedResponse } from '@/types/api';
import { MemberApplication, Group } from '@/types/admin';
import { formatDate } from '@/lib/utils';

export default function MemberApplicationsPage() {
  const { hasPermission, isSuperAdmin, loading: authLoading } = useAuth();

  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);

  // Groups list for approval dropdown
  const [groups, setGroups] = useState<Group[]>([]);

  // Modals & Action States
  const [selectedApp, setSelectedApp] = useState<MemberApplication | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Approval Form State
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [approveNotes, setApproveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  // Alerts
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const canView = isSuperAdmin || hasPermission('member_applications.view');
  const canApprove = isSuperAdmin || hasPermission('member_applications.approve');
  const canReject = isSuperAdmin || hasPermission('member_applications.reject');
  const canDelete = isSuperAdmin || hasPermission('member_applications.delete');

  // Load Groups
  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=50');
        setGroups(res.items || []);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }
    if (canView) {
      loadGroups();
    }
  }, [canView]);

  // Fetch Applications
  const fetchApplications = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setAlertError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      params.set('sort_order', sortOrder);

      const res = await ApiClient.get<PaginatedResponse<MemberApplication>>(
        `/member-applications?${params.toString()}`
      );
      setApplications(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setAlertError(err.message || 'Failed to load member applications.');
    } finally {
      setLoading(false);
    }
  }, [canView, page, pageSize, search, statusFilter, fromDate, toDate, sortOrder]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Open Details Modal
  const handleOpenDetail = async (appId: string) => {
    try {
      const fullApp = await ApiClient.get<MemberApplication>(`/member-applications/${appId}`);
      setSelectedApp(fullApp);
      setIsDetailOpen(true);
    } catch (err: any) {
      setAlertError(err.message || 'Failed to load application details.');
    }
  };

  // Open Approval Dialog
  const handleOpenApprove = (app: MemberApplication) => {
    setSelectedApp(app);
    setSelectedGroupId('');
    setApproveNotes('');
    setIsApproveOpen(true);
  };

  // Execute Approval
  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setActionLoading(true);
    setAlertError(null);
    setAlertSuccess(null);

    try {
      const updated = await ApiClient.post<MemberApplication>(
        `/member-applications/${selectedApp.id}/approve`,
        {
          group_id: selectedGroupId || null,
          review_notes: approveNotes.trim() || null,
        }
      );

      setAlertSuccess(
        `Application ${updated.application_reference} approved! Member enrolled with ID ${updated.member_number || ''}.`
      );
      setIsApproveOpen(false);
      setIsDetailOpen(false);
      fetchApplications();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Rejection Dialog
  const handleOpenReject = (app: MemberApplication) => {
    setSelectedApp(app);
    setRejectionReason('');
    setRejectNotes('');
    setIsRejectOpen(true);
  };

  // Execute Rejection
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (!rejectionReason.trim()) {
      setAlertError('A rejection reason must be provided.');
      return;
    }

    setActionLoading(true);
    setAlertError(null);
    setAlertSuccess(null);

    try {
      const updated = await ApiClient.post<MemberApplication>(
        `/member-applications/${selectedApp.id}/reject`,
        {
          rejection_reason: rejectionReason.trim(),
          review_notes: rejectNotes.trim() || null,
        }
      );

      setAlertSuccess(`Application ${updated.application_reference} marked as rejected.`);
      setIsRejectOpen(false);
      setIsDetailOpen(false);
      fetchApplications();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Application
  const handleDelete = async (appId: string, ref: string) => {
    if (!window.confirm(`Are you sure you want to delete application ${ref}?`)) return;

    try {
      await ApiClient.delete(`/member-applications/${appId}`);
      setAlertSuccess(`Application ${ref} deleted successfully.`);
      fetchApplications();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to delete application.');
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning" className="gap-1 font-medium">
            <Clock className="h-3 w-3" />
            <span>Pending Review</span>
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="success" className="gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1 font-medium">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Permission Guard
  if (!authLoading && !canView) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        <AdminHeader title="Member Applications" subtitle="Foundation membership intake" />
        <main className="p-6">
          <AccessDenied
            permission="member_applications.view"
            message="You do not have permission to view member applications."
          />
        </main>
      </div>
    );
  }

  // Summary counts
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <AdminHeader
        title="Member Applications"
        subtitle="Review, approve, and manage public community membership applications"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Notification Alerts */}
        {alertSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{alertSuccess}</span>
            </div>
            <button
              onClick={() => setAlertSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {alertError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{alertError}</span>
            </div>
            <button
              onClick={() => setAlertError(null)}
              className="text-rose-700 hover:text-rose-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="text-xs text-slate-500 font-medium">Total Registered</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all review statuses</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Pending Review</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
              <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting committee review</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approved Members</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Enrolled into Foundation</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                <span>Rejected</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">{rejectedCount}</div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">Declined with stated reason</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by reference, name, phone, email, or area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchApplications()}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap text-xs text-slate-600">
              <span className="font-medium text-slate-500 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Date Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400">From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 text-xs px-2 rounded border border-slate-200 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400">To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-7 text-xs px-2 rounded border border-slate-200 bg-white"
                />
              </div>
              {(fromDate || toDate || search || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setFromDate('');
                    setToDate('');
                    setPage(1);
                  }}
                  className="text-teal-700 hover:text-teal-900 text-[11px] font-medium underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Applications Data Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Locality / Area</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading membership applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No membership applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">
                        {app.application_reference}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {app.full_name}
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-slate-800">{app.phone}</div>
                        {app.email && (
                          <div className="text-[11px] text-slate-400">{app.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.area || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(app.submitted_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(app.status)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Application Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {app.status === 'pending' && canApprove && (
                            <button
                              type="button"
                              onClick={() => handleOpenApprove(app)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Approve & Enroll Member"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}

                          {app.status === 'pending' && canReject && (
                            <button
                              type="button"
                              onClick={() => handleOpenReject(app)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                              title="Reject Application"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id, app.application_reference)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages}</span> ({total} applications)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* MODAL 1: APPLICATION DETAILS */}
      {isDetailOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Application {selectedApp.application_reference}
                  </h2>
                  {renderStatusBadge(selectedApp.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted on {new Date(selectedApp.submitted_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Applicant Profile Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Full Legal Name</div>
                <div className="text-slate-900 font-semibold mt-0.5">{selectedApp.full_name}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Phone Number</div>
                <div className="text-slate-900 font-semibold mt-0.5">{selectedApp.phone}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Email Address</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {selectedApp.email || 'Not provided'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Date of Birth / Gender</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {selectedApp.date_of_birth ? formatDate(selectedApp.date_of_birth) : 'Not provided'} ({selectedApp.gender})
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                <div className="text-slate-400 font-medium">Residential Address & Locality</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {selectedApp.address || '—'} {selectedApp.area ? `(${selectedApp.area})` : ''}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Occupation</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {selectedApp.occupation || 'Not provided'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Emergency Contact</div>
                <div className="text-slate-900 font-semibold mt-0.5">
                  {selectedApp.emergency_contact || 'Not provided'}
                </div>
              </div>
            </div>

            {/* Motivation & Additional Details */}
            {selectedApp.reason_for_joining && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Reason for Joining Foundation
                </div>
                <p className="text-slate-800 leading-relaxed">{selectedApp.reason_for_joining}</p>
              </div>
            )}

            {selectedApp.additional_info && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Additional Background Information
                </div>
                <p className="text-slate-800 leading-relaxed">{selectedApp.additional_info}</p>
              </div>
            )}

            {/* Review Information Banner */}
            {selectedApp.status === 'approved' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Enrolled Foundation Member</span>
                </div>
                <div>
                  Enrolled Member ID: <strong className="font-mono">{selectedApp.member_number || 'Enrolled'}</strong>
                </div>
                <div>
                  Approved by: <strong>{selectedApp.reviewed_by_name || 'Administrator'}</strong> on{' '}
                  {selectedApp.reviewed_at ? new Date(selectedApp.reviewed_at).toLocaleString() : ''}
                </div>
                {selectedApp.review_notes && (
                  <div className="text-[11px] pt-1 text-emerald-800">
                    Review notes: {selectedApp.review_notes}
                  </div>
                )}
              </div>
            )}

            {selectedApp.status === 'rejected' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
                <div className="flex items-center gap-2 font-bold">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span>Application Rejected</span>
                </div>
                <div>
                  Reason: <strong>{selectedApp.rejection_reason}</strong>
                </div>
                <div>
                  Reviewed by: <strong>{selectedApp.reviewed_by_name || 'Administrator'}</strong>
                </div>
                {selectedApp.review_notes && (
                  <div className="text-[11px] pt-1 text-rose-800">
                    Review notes: {selectedApp.review_notes}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>

              {selectedApp.status === 'pending' && (
                <div className="flex items-center gap-2">
                  {canReject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenReject(selectedApp);
                      }}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenApprove(selectedApp);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve & Enroll
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVAL DIALOG */}
      {isApproveOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Membership Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm enrollment for {selectedApp.full_name} ({selectedApp.application_reference})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assign Savings Circle / Cluster Group <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">No Group / Unassigned</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can assign this member to an existing community group now or at a later stage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Internal Review & Orientation Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Identity verified by phone. Scheduled for community orientation on Monday."
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  This action will atomically create an active Member record with an auto-generated Member ID and mark this application as Approved.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApproveOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Enrolling Member...' : 'Confirm & Enroll Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION DIALOG */}
      {isRejectOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Membership Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decline application for {selectedApp.full_name} ({selectedApp.application_reference})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Applicant resides outside Foundation service perimeter; or incomplete identity documentation."
                  required
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Internal Administrative Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes for audit trail..."
                  className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
