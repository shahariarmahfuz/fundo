'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api';
import { Member, Beneficiary, Fund } from '@/types/admin';
import { PaginatedResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import {
  HandHeart,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  Users,
  HeartHandshake,
  DollarSign,
  Landmark,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AddSadaqaPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading, user, isSuperAdmin } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [donorType, setDonorType] = useState<'member' | 'beneficiary' | 'other'>('other');
  const [form, setForm] = useState({
    member_id: '',
    beneficiary_id: '',
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    is_anonymous: false,
    amount: '',
    fund_id: '',
    donation_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    purpose: 'General Sadaqa',
    notes: ''
  });

  const canCreate = isSuperAdmin || hasPermission('sadaqa.create');

  useEffect(() => {
    async function loadFormData() {
      if (!hasPermission('sadaqa.create') && !isSuperAdmin) {
        setLoadingData(false);
        return;
      }
      try {
        setLoadingData(true);
        const [memRes, benRes, fundRes] = await Promise.all([
          ApiClient.get<PaginatedResponse<Member>>('/members?page=1&page_size=150').catch(() => ({ items: [] })),
          ApiClient.get<PaginatedResponse<Beneficiary>>('/beneficiaries?page=1&page_size=150').catch(() => ({ items: [] })),
          ApiClient.get<Fund[]>('/finance/funds?active_only=true').catch(() => [])
        ]);

        const memList = (memRes as PaginatedResponse<Member>).items || [];
        const benList = (benRes as PaginatedResponse<Beneficiary>).items || [];
        const fundList = (fundRes as Fund[]) || [];

        setMembers(memList);
        setBeneficiaries(benList);
        setFunds(fundList);

        if (fundList.length > 0) {
          setForm((prev) => ({ ...prev, fund_id: fundList[0].id }));
        }
      } catch (err) {
        console.error('Failed to load form prerequisite data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (!authLoading) {
      loadFormData();
    }
  }, [authLoading, hasPermission, isSuperAdmin]);

  const handleMemberSelect = (memberId: string) => {
    const mem = members.find((m) => m.id === memberId);
    setForm((prev) => ({
      ...prev,
      member_id: memberId,
      donor_name: mem?.full_name || '',
      donor_email: mem?.email || '',
      donor_phone: mem?.phone || ''
    }));
  };

  const handleBeneficiarySelect = (benId: string) => {
    const ben = beneficiaries.find((b) => b.id === benId);
    setForm((prev) => ({
      ...prev,
      beneficiary_id: benId,
      donor_name: ben?.full_name || '',
      donor_phone: ben?.phone || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    const amountVal = parseFloat(form.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Please enter a valid positive donation amount.');
      setSubmitting(false);
      return;
    }

    if (!form.fund_id) {
      setErrorMsg('Please select a destination capital fund.');
      setSubmitting(false);
      return;
    }

    if (donorType === 'member' && !form.member_id) {
      setErrorMsg('Please select an active foundation member.');
      setSubmitting(false);
      return;
    }

    if (donorType === 'beneficiary' && !form.beneficiary_id) {
      setErrorMsg('Please select a registered beneficiary.');
      setSubmitting(false);
      return;
    }

    if (donorType === 'other' && !form.is_anonymous && !form.donor_name.trim()) {
      setErrorMsg('Please enter the donor’s name or check "Anonymous Donor".');
      setSubmitting(false);
      return;
    }

    try {
      const res = await ApiClient.post<any>('/sadaqa', {
        donor_type: donorType,
        member_id: donorType === 'member' ? form.member_id : undefined,
        beneficiary_id: donorType === 'beneficiary' ? form.beneficiary_id : undefined,
        donor_name: form.is_anonymous ? 'Anonymous Donor' : form.donor_name.trim() || undefined,
        donor_email: form.donor_email.trim() || undefined,
        donor_phone: form.donor_phone.trim() || undefined,
        is_anonymous: form.is_anonymous,
        amount: amountVal,
        fund_id: form.fund_id,
        donation_date: form.donation_date || undefined,
        payment_method: form.payment_method,
        reference: form.reference.trim() || undefined,
        purpose: form.purpose.trim() || 'General Sadaqa',
        notes: form.notes.trim() || undefined
      });

      setSuccessMsg(`Sadaqa donation of ${formatCurrency(amountVal)} recorded successfully! (Receipt: ${res.receipt_number})`);
      setTimeout(() => {
        router.push('/admin/sadaqa');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record Sadaqa donation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-slate-400 text-sm">Verifying permissions...</div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Add Sadaqa"
          subtitle="Charitable donation recording"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="sadaqa.create"
          message="You do not have authorization to record new Sadaqa donations."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      <AdminHeader
        title="Add Sadaqa"
        subtitle="Record voluntary charitable donations into Foundation funds"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/sadaqa"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sadaqa Registry</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Permanent Donation Rule Card */}
        <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-teal-950">Permanent Benevolent Gift (No Repayment)</div>
            <p className="text-teal-800 leading-relaxed">
              Sadaqa is a voluntary, non-repayable charitable donation. Recording this donation increases the selected
              fund balance and creates an irrevocable double-entry accounting entry (Debit: Cash/Bank, Credit: Donation Revenue).
            </p>
          </div>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-teal-700" />
              <span>Donation Details Form</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Donor Classification */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Donor Classification
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDonorType('other');
                      setForm((prev) => ({ ...prev, member_id: '', beneficiary_id: '' }));
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                      donorType === 'other'
                        ? 'border-teal-700 bg-teal-50/50 text-teal-950 ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <User className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">External / Non-Member</div>
                      <div className="text-[10px] text-slate-500">General public or sponsor</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDonorType('member');
                      setForm((prev) => ({ ...prev, beneficiary_id: '' }));
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                      donorType === 'member'
                        ? 'border-teal-700 bg-teal-50/50 text-teal-950 ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Users className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Existing Member</div>
                      <div className="text-[10px] text-slate-500">Select registered member</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDonorType('beneficiary');
                      setForm((prev) => ({ ...prev, member_id: '' }));
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                      donorType === 'beneficiary'
                        ? 'border-teal-700 bg-teal-50/50 text-teal-950 ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <HeartHandshake className="h-4 w-4 text-teal-700 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">Existing Beneficiary</div>
                      <div className="text-[10px] text-slate-500">Registered aid recipient</div>
                    </div>
                  </button>
                </div>

                {/* Sub-inputs depending on donor type */}
                {donorType === 'member' && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Select Member <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.member_id}
                      onChange={(e) => handleMemberSelect(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="">-- Choose Member --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.member_number}) {m.phone ? `• ${m.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {donorType === 'beneficiary' && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Select Beneficiary <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.beneficiary_id}
                      onChange={(e) => handleBeneficiarySelect(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="">-- Choose Beneficiary --</option>
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.full_name} ({b.beneficiary_code}) {b.phone ? `• ${b.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Donor Name {!form.is_anonymous && donorType === 'other' && <span className="text-rose-500">*</span>}
                    </label>
                    <Input
                      placeholder={form.is_anonymous ? 'Anonymous' : 'Donor Full Name'}
                      disabled={form.is_anonymous}
                      value={form.is_anonymous ? 'Anonymous Donor' : form.donor_name}
                      onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="donor@example.com"
                      value={form.donor_email}
                      onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={form.donor_phone}
                      onChange={(e) => setForm({ ...form, donor_phone: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_anonymous}
                      onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      Record as Anonymous Donor (Receipt and reports will mask donor identity)
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 2: Donation Amount & Destination */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Donation Inflow & Accounting
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Donation Amount ($) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 5000.00"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="pl-9 h-9 text-xs font-semibold text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Destination Fund <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.fund_id}
                      onChange={(e) => setForm({ ...form, fund_id: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                      required
                    >
                      <option value="">-- Choose Fund --</option>
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.code}) • Balance: {formatCurrency(f.current_balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Donation Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.donation_date}
                      onChange={(e) => setForm({ ...form, donation_date: e.target.value })}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="bank_transfer">Bank Wire / Transfer</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="cash">Direct Cash</option>
                      <option value="cheque">Bank Cheque</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Transaction / Cheque Ref
                    </label>
                    <Input
                      placeholder="e.g. WIRE-88192, CHK-102"
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Purpose & Notes */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Charitable Purpose & Documentation
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Charitable Purpose
                    </label>
                    <select
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="General Sadaqa">General Sadaqa</option>
                      <option value="Emergency Food & Relief">Emergency Food & Relief</option>
                      <option value="Healthcare & Medical Aid">Healthcare & Medical Aid</option>
                      <option value="Orphan & Education Support">Orphan & Education Support</option>
                      <option value="Water Well & Sanitation">Water Well & Sanitation</option>
                      <option value="Mosque & Community Center">Mosque & Community Center</option>
                      <option value="Winter Warmth & Shelter">Winter Warmth & Shelter</option>
                      <option value="Specific Cause">Specific Designated Cause</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Custom Purpose Tag / Cause
                    </label>
                    <Input
                      placeholder="e.g. Ramadan Aid Basket, Flood Relief"
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Auditor & Donor Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Optional details, donor stipulations, or receipt reference notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Submission Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link href="/admin/sadaqa">
                  <Button variant="outline" size="sm" type="button" className="text-xs">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || loadingData}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs gap-1.5"
                >
                  <HandHeart className="h-4 w-4" />
                  <span>{submitting ? 'Recording Donation...' : 'Record Permanent Sadaqa'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
