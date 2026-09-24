'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MediaUploader } from '@/components/media/MediaUploader';
import { ApiClient } from '@/lib/api';
import { Group } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  User,
  Phone,
  FileText,
  Shield,
  HeartHandshake,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddMemberPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    // Section 1: Basic Information (Required: full_name, group_id, join_date; Optional: member_id)
    member_id: '',
    full_name: '',
    group_id: '',
    join_date: new Date().toISOString().split('T')[0],

    // Section 2: Personal Information (Optional)
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    gender: 'female',
    national_id: '',
    occupation: '',
    education: '',
    blood_group: '',
    marital_status: '',
    phone: '',
    alt_phone: '',
    email: '',
    present_address: '',
    permanent_address: '',

    // Section 3: Emergency Contact (Optional)
    emergency_name: '',
    emergency_relation: '',
    emergency_phone: '',

    // Section 4: Reference (Optional)
    reference_name: '',
    reference_phone: '',
    reference_relation: '',

    // Section 5: Commitment (Optional)
    commitment: '',

    // Section 6: Documents & Media (Optional)
    photo_url: '',
    signature_url: '',
    document_type: 'National ID',
    nid_front_url: '',
    nid_back_url: '',

    // Section 7: Additional Information (Optional)
    reason_for_joining: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchGroups() {
      try {
        setGroupsLoading(true);
        const res = await ApiClient.get<PaginatedResponse<Group>>('/groups?page=1&page_size=100');
        setGroups(res.items);
        if (res.items.length > 0 && !form.group_id) {
          setForm((prev) => ({ ...prev, group_id: res.items[0].id }));
        }
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setGroupsLoading(false);
      }
    }
    fetchGroups();
  }, []);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!hasPermission('members.create')) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader
          title="Add Member"
          subtitle="Register a new foundation community member"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          message="Your role does not have authorization to register new members."
          permission="members.create"
        />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Client-side validation: Only the 3 required fields
    if (!form.full_name.trim()) {
      setErrorMsg('Full Name is required.');
      setSubmitting(false);
      return;
    }
    if (!form.group_id) {
      setErrorMsg('Group selection is required.');
      setSubmitting(false);
      return;
    }
    if (!form.join_date) {
      setErrorMsg('Join Date is required.');
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        full_name: form.full_name.trim(),
        group_id: form.group_id,
        join_date: form.join_date,
      };

      // Optional Member ID
      if (form.member_id.trim()) {
        payload.member_id = form.member_id.trim();
      }

      // Optional Personal Information
      if (form.father_name.trim()) payload.father_name = form.father_name.trim();
      if (form.mother_name.trim()) payload.mother_name = form.mother_name.trim();
      if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
      if (form.gender) payload.gender = form.gender;
      if (form.national_id.trim()) payload.national_id = form.national_id.trim();
      if (form.occupation.trim()) payload.occupation = form.occupation.trim();
      if (form.education.trim()) payload.education = form.education.trim();
      if (form.blood_group.trim()) payload.blood_group = form.blood_group.trim();
      if (form.marital_status.trim()) payload.marital_status = form.marital_status.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.alt_phone.trim()) payload.alt_phone = form.alt_phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.present_address.trim()) payload.present_address = form.present_address.trim();
      if (form.permanent_address.trim()) payload.permanent_address = form.permanent_address.trim();

      // Optional Emergency Contact
      if (form.emergency_name.trim()) payload.emergency_name = form.emergency_name.trim();
      if (form.emergency_relation.trim()) payload.emergency_relation = form.emergency_relation.trim();
      if (form.emergency_phone.trim()) payload.emergency_phone = form.emergency_phone.trim();

      // Optional Reference
      if (form.reference_name.trim()) payload.reference_name = form.reference_name.trim();
      if (form.reference_phone.trim()) payload.reference_phone = form.reference_phone.trim();
      if (form.reference_relation.trim()) payload.reference_relation = form.reference_relation.trim();

      // Optional Commitment
      if (form.commitment.trim()) payload.commitment = form.commitment.trim();

      // Optional Documents
      if (form.photo_url) payload.photo_url = form.photo_url;
      if (form.signature_url) payload.signature_url = form.signature_url;
      if (form.document_type) payload.document_type = form.document_type;
      if (form.nid_front_url) payload.nid_front_url = form.nid_front_url;
      if (form.nid_back_url) payload.nid_back_url = form.nid_back_url;

      // Optional Additional Information
      if (form.reason_for_joining.trim()) payload.reason_for_joining = form.reason_for_joining.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const createdMember = await ApiClient.post<any>('/members', payload);

      setSuccessMsg(
        `Member ${createdMember.full_name} (${createdMember.member_number}) registered successfully.`
      );

      setTimeout(() => {
        router.push('/admin/members');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <AdminHeader
        title="Add Member"
        subtitle="Register a new community member. Only Full Name, Group, and Join Date are required."
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Top Header / Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/members"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Member Directory
          </Link>
          <div className="text-xs text-slate-500">
            Fields marked with <span className="text-rose-500 font-bold">*</span> are required
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: BASIC INFORMATION (REQUIRED CORE FIELDS) */}
          <Card className="border-teal-100 shadow-xs">
            <CardHeader className="bg-teal-50/50 border-b border-teal-100/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <CardTitle className="text-sm text-teal-950 font-bold">Basic Information</CardTitle>
                  <CardDescription className="text-xs text-teal-800/80">
                    Mandatory foundation registration credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Full Name * (REQUIRED) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-800">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Fatima Begum"
                    required
                    className="text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Official legal name of the member.</p>
                </div>

                {/* Member ID (OPTIONAL) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">Member ID</label>
                    <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                  </div>
                  <Input
                    type="text"
                    name="member_id"
                    value={form.member_id}
                    onChange={handleChange}
                    placeholder="Auto-generated if blank (e.g. M-00001)"
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400">Leave blank to auto-generate next ID.</p>
                </div>

                {/* Group * (REQUIRED) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Group / Circle <span className="text-rose-500">*</span>
                  </label>
                  {groupsLoading ? (
                    <div className="text-xs text-slate-400 py-2">Loading groups...</div>
                  ) : groups.length === 0 ? (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      No groups found. Please create a Group first.
                    </div>
                  ) : (
                    <select
                      name="group_id"
                      value={form.group_id}
                      onChange={handleChange}
                      required
                      className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="">Select a Group...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.code})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-400">Circle this member participates in.</p>
                </div>

                {/* Join Date * (REQUIRED) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Join Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="join_date"
                    value={form.join_date}
                    onChange={handleChange}
                    required
                    className="text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Date membership officially began.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PERSONAL INFORMATION (ALL OPTIONAL) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
                    <CardDescription className="text-xs">Optional personal and demographic details</CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  All fields optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mobile Number (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Mobile Number</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs"
                  />
                </div>

                {/* Alternative Mobile (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Alternative Mobile</label>
                  <Input
                    type="tel"
                    name="alt_phone"
                    value={form.alt_phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0001"
                    className="text-xs"
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="member@example.com"
                    className="text-xs"
                  />
                </div>

                {/* Date of Birth (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Date of Birth</label>
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="text-xs"
                  />
                </div>

                {/* Gender (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other / Not Specified</option>
                  </select>
                </div>

                {/* National ID / Birth Certificate (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">NID / Birth Certificate #</label>
                  <Input
                    type="text"
                    name="national_id"
                    value={form.national_id}
                    onChange={handleChange}
                    placeholder="e.g. 19882691234000123"
                    className="text-xs"
                  />
                </div>

                {/* Father's Name (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Father’s Name</label>
                  <Input
                    type="text"
                    name="father_name"
                    value={form.father_name}
                    onChange={handleChange}
                    placeholder="e.g. Abdul Rahman"
                    className="text-xs"
                  />
                </div>

                {/* Mother's Name (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Mother’s Name</label>
                  <Input
                    type="text"
                    name="mother_name"
                    value={form.mother_name}
                    onChange={handleChange}
                    placeholder="e.g. Rokeya Begum"
                    className="text-xs"
                  />
                </div>

                {/* Occupation (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Occupation / Workplace</label>
                  <Input
                    type="text"
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Tailor / Self-employed"
                    className="text-xs"
                  />
                </div>

                {/* Education (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Education</label>
                  <Input
                    type="text"
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    placeholder="e.g. Secondary School"
                    className="text-xs"
                  />
                </div>

                {/* Blood Group (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Blood Group</label>
                  <select
                    name="blood_group"
                    value={form.blood_group}
                    onChange={handleChange}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="">Select blood group...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Marital Status (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Marital Status</label>
                  <select
                    name="marital_status"
                    value={form.marital_status}
                    onChange={handleChange}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="">Select marital status...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                {/* Present Address (Optional) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">Present Address</label>
                  <Input
                    type="text"
                    name="present_address"
                    value={form.present_address}
                    onChange={handleChange}
                    placeholder="Current street, village/ward, and city"
                    className="text-xs"
                  />
                </div>

                {/* Permanent Address (Optional) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">Permanent Address</label>
                  <Input
                    type="text"
                    name="permanent_address"
                    value={form.permanent_address}
                    onChange={handleChange}
                    placeholder="Permanent home village/ward and district"
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: EMERGENCY CONTACT (OPTIONAL) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Emergency Contact</CardTitle>
                    <CardDescription className="text-xs">Optional contact in case of emergency</CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Emergency Contact Name</label>
                  <Input
                    type="text"
                    name="emergency_name"
                    value={form.emergency_name}
                    onChange={handleChange}
                    placeholder="e.g. Tariqul Islam"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Relationship</label>
                  <Input
                    type="text"
                    name="emergency_relation"
                    value={form.emergency_relation}
                    onChange={handleChange}
                    placeholder="e.g. Brother / Spouse"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Emergency Mobile Number</label>
                  <Input
                    type="tel"
                    name="emergency_phone"
                    value={form.emergency_phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0002"
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: REFERENCE (OPTIONAL) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Reference</CardTitle>
                    <CardDescription className="text-xs">Optional community or peer reference</CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Reference Name</label>
                  <Input
                    type="text"
                    name="reference_name"
                    value={form.reference_name}
                    onChange={handleChange}
                    placeholder="e.g. Master Habib"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Reference Mobile Number</label>
                  <Input
                    type="tel"
                    name="reference_phone"
                    value={form.reference_phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0003"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Relationship</label>
                  <Input
                    type="text"
                    name="reference_relation"
                    value={form.reference_relation}
                    onChange={handleChange}
                    placeholder="e.g. Neighbor / Local Teacher"
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: COMMITMENT (OPTIONAL) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Commitment & Declaration</CardTitle>
                    <CardDescription className="text-xs">Optional community commitment pledge</CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <textarea
                name="commitment"
                value={form.commitment}
                onChange={handleChange}
                rows={3}
                placeholder="I declare that I willingly participate in the Foundation savings circle..."
                className="w-full text-xs rounded-md border border-slate-200 p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 resize-none"
              />
            </CardContent>
          </Card>

          {/* SECTION 6: DOCUMENTS & MEDIA (OPTIONAL - UNIVERSAL CLOUDINARY UPLOADER) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    6
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Documents & Media</CardTitle>
                    <CardDescription className="text-xs">
                      Optional member photo, signature, and identity documents using Cloudinary
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Photo */}
                <MediaUploader
                  type="image"
                  purpose="member"
                  value={form.photo_url}
                  aspectRatio="square"
                  maxSizeMB={5}
                  label="Member Photo (Optional)"
                  helperText="Upload member profile picture. Formats: JPG, PNG, WebP (Max 5MB)."
                  onUpload={(res) => setForm((prev) => ({ ...prev, photo_url: res.url }))}
                  onRemove={() => setForm((prev) => ({ ...prev, photo_url: '' }))}
                />

                {/* Signature */}
                <MediaUploader
                  type="image"
                  purpose="member"
                  value={form.signature_url}
                  aspectRatio="cover"
                  maxSizeMB={5}
                  label="Signature (Optional)"
                  helperText="Clear photo or scan of signature. Formats: JPG, PNG, WebP (Max 5MB)."
                  onUpload={(res) => setForm((prev) => ({ ...prev, signature_url: res.url }))}
                  onRemove={() => setForm((prev) => ({ ...prev, signature_url: '' }))}
                />
              </div>

              {/* Document Type Selector */}
              <div className="pt-2 border-t border-slate-100">
                <div className="max-w-xs space-y-1 mb-4">
                  <label className="text-xs font-semibold text-slate-800">Document Type</label>
                  <select
                    name="document_type"
                    value={form.document_type}
                    onChange={handleChange}
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="National ID">National ID Card (NID)</option>
                    <option value="Birth Certificate">Birth Certificate</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Other Document">Other Document</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* National ID Front */}
                  <MediaUploader
                    type="image"
                    purpose="member"
                    value={form.nid_front_url}
                    aspectRatio="cover"
                    maxSizeMB={5}
                    label="Document Front Side (Optional)"
                    helperText="Upload front side of identity document."
                    onUpload={(res) => setForm((prev) => ({ ...prev, nid_front_url: res.url }))}
                    onRemove={() => setForm((prev) => ({ ...prev, nid_front_url: '' }))}
                  />

                  {/* National ID Back */}
                  <MediaUploader
                    type="image"
                    purpose="member"
                    value={form.nid_back_url}
                    aspectRatio="cover"
                    maxSizeMB={5}
                    label="Document Back Side (Optional)"
                    helperText="Upload back side of identity document."
                    onUpload={(res) => setForm((prev) => ({ ...prev, nid_back_url: res.url }))}
                    onRemove={() => setForm((prev) => ({ ...prev, nid_back_url: '' }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 7: ADDITIONAL INFORMATION & INTERNAL NOTES (OPTIONAL) */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    7
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Additional Information & Notes</CardTitle>
                    <CardDescription className="text-xs">
                      Optional member background and internal staff notes
                    </CardDescription>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Reason for Joining (Optional)</label>
                <textarea
                  name="reason_for_joining"
                  value={form.reason_for_joining}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Seeking mutual support for small vegetable farming circle..."
                  className="w-full text-xs rounded-md border border-slate-200 p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <span>Internal Staff Notes (Optional)</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-normal">
                    Private / Staff Only
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. Member requested contribution collection through monthly group meeting."
                  className="w-full text-xs rounded-md border border-slate-200 p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  Internal notes are visible only to staff and never published on public pages.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/admin/members">
              <Button type="button" variant="outline" size="md" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="bg-teal-700 hover:bg-teal-800 text-white min-w-[140px]"
            >
              {submitting ? 'Registering...' : 'Register Member'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
