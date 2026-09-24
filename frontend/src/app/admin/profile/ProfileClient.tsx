'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User as UserIcon,
  UserCog,
  KeyRound,
  SlidersHorizontal,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  LogOut,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { getPreferences, savePreferences } from '@/lib/preferences';
import { User } from '@/types/api';

export type ProfileTab = 'overview' | 'manage' | 'password' | 'preferences';

interface ProfileClientProps {
  defaultTab?: ProfileTab;
}

export function ProfileClient({ defaultTab = 'overview' }: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, logout, isSuperAdmin } = useAuth();

  // Determine active tab from search params or default
  const paramTab = searchParams.get('tab') as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(paramTab || defaultTab);

  useEffect(() => {
    if (paramTab && ['overview', 'manage', 'password', 'preferences'].includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  // Manage Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync user state to form
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preferences state
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [pageSize, setPageSize] = useState(25);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  useEffect(() => {
    const prefs = getPreferences();
    setTimezone(prefs.timezone);
    setDateFormat(prefs.dateFormat);
    setPageSize(prefs.pageSize);
  }, []);

  // Update URL on tab change without full reload
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setProfileSuccess(null);
    setProfileError(null);
    setPasswordSuccess(null);
    setPasswordError(null);
    setPrefSuccess(null);
    router.replace(`/admin/profile?tab=${tab}`);
  };

  // Submit Profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const updatedUser = await ApiClient.patch<User>('/auth/profile', {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });
      setUser(updatedUser);
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Submit Password update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      await ApiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setPasswordSuccess('Password changed successfully. Your account is secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Submit Preferences update
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences({
      timezone,
      dateFormat,
      pageSize,
    });
    setPrefSuccess('Display preferences saved successfully.');
  };

  const displayName = user?.full_name || 'Admin User';
  const displayEmail = user?.email || 'admin@fundo.org';
  const roleName = user?.is_superadmin
    ? 'Super Admin'
    : user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')
    : 'Administrator';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'A';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <AdminHeader
        title="User Profile & Settings"
        subtitle="Manage your personal account details, security credentials, and preferences"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Profile Header Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                <Badge variant="info">{roleName}</Badge>
                <Badge variant="success" className="gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{displayEmail}</p>
              {user?.phone && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap px-1 ${
              activeTab === 'overview'
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('manage')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap px-1 ${
              activeTab === 'manage'
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <UserCog className="h-4 w-4" />
            <span>Manage Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('password')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap px-1 ${
              activeTab === 'password'
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('preferences')}
            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap px-1 ${
              activeTab === 'preferences'
                ? 'border-teal-700 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* TAB 1: PROFILE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal account and identity attributes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Full Name</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">{displayName}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Email / Username</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">{displayEmail}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Phone Number</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {user?.phone || 'Not provided'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Account Status</div>
                      <div className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Active & Verified
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Role Assignment</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">{roleName}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">Super Administrator</div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {isSuperAdmin ? 'Yes (Full Access)' : 'No (Standard RBAC)'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTabChange('manage')}
                    >
                      <UserCog className="h-4 w-4 mr-1.5" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTabChange('password')}
                    >
                      <KeyRound className="h-4 w-4 mr-1.5" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions & Security Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Permissions & Access Privileges</CardTitle>
                  <CardDescription>
                    {isSuperAdmin
                      ? 'As a Super Administrator, you have unrestricted access across all modules.'
                      : 'Assigned system permissions for your current role.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSuperAdmin ? (
                    <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg text-teal-800 text-xs flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
                      <span>
                        Full administrative governance: You possess administrative privileges over members,
                        groups, contributions, Qard Hasanah, Sadaqa, and reporting.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                      {user?.permissions && user.permissions.length > 0 ? (
                        user.permissions.map((perm) => (
                          <Badge key={perm} variant="default" className="text-[11px] font-mono">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No custom permissions assigned.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Security Level</span>
                    <span className="font-medium text-slate-800">
                      {isSuperAdmin ? 'Elevated (SuperAdmin)' : 'Standard User'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Two-Factor Auth</span>
                    <span className="font-medium text-amber-600">Standard Auth</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Active Session</span>
                    <span className="font-medium text-emerald-600">Authenticated (JWT)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500">Interface Theme</span>
                    <span className="font-medium text-slate-800">Light Mode</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-50/50 border-dashed">
                <CardContent className="p-4 text-xs text-slate-500 space-y-2">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    <span>Role Restrictions</span>
                  </div>
                  <p>
                    Non-administrative users cannot modify roles, permissions, or system status.
                    To request access level elevation, consult your Foundation Super Admin.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE PROFILE */}
        {activeTab === 'manage' && (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Manage Personal Information</CardTitle>
                <CardDescription>
                  Update your contact and personal information. System roles and permissions are locked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Editable: Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Amina Rahman"
                      required
                    />
                  </div>

                  {/* Editable: Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number / Contact Info
                    </label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                  </div>

                  {/* Read-Only: Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">Email Address / Username</label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                    <Input
                      type="email"
                      value={displayEmail}
                      disabled
                      className="bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Your email address is your unique system identifier and cannot be modified here.
                    </p>
                  </div>

                  {/* Read-Only: Role */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">Assigned Role</label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                    <Input
                      type="text"
                      value={roleName}
                      disabled
                      className="bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Normal users cannot alter roles, permissions, or administrative access.
                    </p>
                  </div>

                  {/* Read-Only: Status */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">Account Status</label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    </div>
                    <Input
                      type="text"
                      value="Active (Managed by Administrator)"
                      disabled
                      className="bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <Button type="submit" variant="primary" disabled={profileSaving}>
                      <Save className="h-4 w-4 mr-1.5" />
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <div className="max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is using a long, random password to stay secure. Minimum 6 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Password must be at least 6 characters long.
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" disabled={passwordSaving}>
                      <KeyRound className="h-4 w-4 mr-1.5" />
                      {passwordSaving ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="max-w-xl">
            <Card>
              <CardHeader>
                <CardTitle>Display & Regional Preferences</CardTitle>
                <CardDescription>
                  Configure display formatting, timezone, and pagination preferences for your session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prefSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{prefSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSavePreferences} className="space-y-4">
                  {/* Timezone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST / EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST / CDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                      <option value="Europe/London">Europe/London (GMT / BST)</option>
                      <option value="Asia/Dhaka">Asia/Dhaka (BST, UTC+6)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                      <option value="Asia/Riyadh">Asia/Riyadh (AST, UTC+3)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dates and timestamps across reports and tables will reflect this timezone.
                    </p>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date Format</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard - e.g. 2026-09-24)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (International - e.g. 24/09/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard - e.g. 09/24/2026)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (Hyphenated - e.g. 24-09-2026)</option>
                    </select>
                  </div>

                  {/* Table Page Size */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Table Page Size (Items Per Page)
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                    >
                      <option value={10}>10 items per page</option>
                      <option value={25}>25 items per page (Default)</option>
                      <option value={50}>50 items per page</option>
                      <option value={100}>100 items per page</option>
                    </select>
                  </div>

                  {/* Theme Policy - Light Mode Only */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-800">Interface Theme</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Standard Light Mode. Dark Mode is disabled by administrative policy.
                        </div>
                      </div>
                      <Badge variant="info" className="text-[10px]">
                        Light Mode Only
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary">
                      <Save className="h-4 w-4 mr-1.5" />
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
