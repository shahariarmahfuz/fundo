'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  HeartHandshake,
  ShieldCheck,
  Users,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';

interface SuccessData {
  reference: string;
  submittedAt: string;
  name: string;
  phone: string;
}

export default function ApplyForMembershipPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'other',
    phone: '',
    email: '',
    address: '',
    area: '',
    occupation: '',
    emergency_contact: '',
    reason_for_joining: '',
    additional_info: '',
    consent: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.consent) {
      setErrorMsg('You must agree to the declaration and verification consent before submitting.');
      return;
    }

    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      setErrorMsg('Please enter your full legal name (at least 2 characters).');
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 6) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        phone: formData.phone.trim(),
        email: formData.email.trim() ? formData.email.trim() : null,
        address: formData.address.trim() ? formData.address.trim() : null,
        area: formData.area.trim() ? formData.area.trim() : null,
        occupation: formData.occupation.trim() ? formData.occupation.trim() : null,
        emergency_contact: formData.emergency_contact.trim() ? formData.emergency_contact.trim() : null,
        reason_for_joining: formData.reason_for_joining.trim() ? formData.reason_for_joining.trim() : null,
        additional_info: formData.additional_info.trim() ? formData.additional_info.trim() : null,
        consent: true,
      };

      const res = await ApiClient.post<{
        success: boolean;
        message: string;
        application_reference: string;
        submitted_at: string;
      }>('/public/member-applications', payload);

      setSuccessData({
        reference: res.application_reference,
        submittedAt: res.submitted_at,
        name: formData.full_name.trim(),
        phone: formData.phone.trim(),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting your application. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = () => {
    if (successData?.reference) {
      navigator.clipboard.writeText(successData.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setFormData({
      full_name: '',
      date_of_birth: '',
      gender: 'other',
      phone: '',
      email: '',
      address: '',
      area: '',
      occupation: '',
      emergency_contact: '',
      reason_for_joining: '',
      additional_info: '',
      consent: false,
    });
    setErrorMsg(null);
  };

  // SUCCESS CONFIRMATION SCREEN
  if (successData) {
    return (
      <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm text-center space-y-6">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Application Submitted Successfully
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Thank you for applying to join the Fundo Foundation. Your application has been logged and queued for administrative review.
              </p>
            </div>

            {/* Application Reference Card */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-6 max-w-md mx-auto space-y-3">
              <div className="text-xs uppercase tracking-wider text-teal-800 font-semibold">
                Your Application Reference Number
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold text-teal-900 tracking-wider">
                  {successData.reference}
                </span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="p-1.5 rounded-md hover:bg-teal-100 text-teal-700 transition-colors"
                  title="Copy Reference Number"
                  aria-label="Copy reference number"
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-[11px] text-teal-700">
                Please save this reference number. It will be used for tracking your verification and membership enrollment.
              </p>
            </div>

            {/* Applicant Summary Details */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-6 text-left max-w-lg mx-auto space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Applicant Name:</span>
                <span className="font-semibold text-slate-900">{successData.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Contact Phone:</span>
                <span className="font-semibold text-slate-900">{successData.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Initial Status:</span>
                <Badge variant="warning" className="text-[10px]">
                  Pending Review
                </Badge>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Submission Timestamp:</span>
                <span className="font-medium text-slate-800">
                  {new Date(successData.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* What Happens Next Steps */}
            <div className="border-t border-slate-100 pt-6 text-left max-w-lg mx-auto space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                What happens next?
              </h3>
              <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside">
                <li>
                  <strong className="text-slate-800">Committee Review:</strong> Our field administration team will review your submitted profile within 2–3 business days.
                </li>
                <li>
                  <strong className="text-slate-800">Verification & Outreach:</strong> A local coordinator may contact you via phone or SMS for community reference checks.
                </li>
                <li>
                  <strong className="text-slate-800">Enrollment & Group Placement:</strong> Upon formal approval, your active Member record will be created and you will receive your welcome details.
                </li>
              </ol>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Return to Homepage
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={handleReset} className="w-full sm:w-auto">
                Submit Another Application
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // APPLICATION FORM SCREEN
  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <Badge variant="info" className="gap-1.5 py-1 px-3">
            <Users className="h-3.5 w-3.5 text-teal-700" />
            <span>Public Membership Intake</span>
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Apply for Foundation Membership
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Join our cooperative solidarity network. Members participate in collective savings circles, access interest-free micro-loans (Qard Hasanah), and support community mutual aid.
          </p>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Zero Interest</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Strictly ethical, interest-free revolving finance.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Mutual Solidarity</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Participate in transparent peer-supported savings.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Community Clusters</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Local neighborhood chapters and artisan groups.</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Application Submission Error:</span>
              <p className="text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Main Application Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Membership Application Form</h2>
            <p className="text-xs text-slate-500 mt-1">
              Please complete all required fields accurately. No account or prior login required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Applicant Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Fatima Zahra Al-Mansoor"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Prefer not to say / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 (555) 923-4411"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Used for application notifications and verification.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. applicant@example.org"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Residential & Contact Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Location & Background</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street name, building number, apartment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Area / City / Locality
                  </label>
                  <Input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g. Northern Hills or Downtown"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Current Occupation
                  </label>
                  <Input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Teacher, Artisan, Health Worker, Small Business"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Emergency Contact <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Name and contact number of a relative or guardian"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Reason & Supplemental Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900">Membership Motivation</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Why do you wish to join the Foundation?
                  </label>
                  <textarea
                    name="reason_for_joining"
                    value={formData.reason_for_joining}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Briefly explain your interest in community savings, mutual solidarity, or cooperative activities..."
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Additional Information or Experience <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any community initiatives, vocational skills, or volunteer background..."
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Declaration & Consent */}
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                    required
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Declaration & Agreement:</strong> I confirm that all information provided in this application is truthful and accurate. I agree to abide by the principles, community bylaws, and ethical solidarity framework of the Fundo Foundation. I authorize the Foundation intake committee to review this submission. <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                ← Return to Homepage
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || !formData.consent}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
