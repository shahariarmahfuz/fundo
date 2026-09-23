'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ApiClient } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      await ApiClient.post('/public/inquiries', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    }
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Get in Touch</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Contact Foundation Stewardship & Inquiries
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Have questions about project partnerships, donor endowments, or community membership? Reach out to our dedicated team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Headquarters</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      100 Global Hope Way, Suite 400<br />
                      Geneva / New York
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Public Inquiries</h3>
                    <p className="text-xs text-slate-600 mt-1">contact@fundo.org</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Toll-Free Hotline</h3>
                    <p className="text-xs text-slate-600 mt-1">+1 (800) 555-FUNDO</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {status === 'success' ? (
                  <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-emerald-900">Message Received</h3>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Thank you for contacting Fundo Foundation. A member of our stewardship team will review your inquiry within one business day.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus('idle')}
                      className="mt-2 text-xs"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {status === 'error' && (
                      <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Your Full Name</label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Dr. Omar Farooq"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Email Address</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="omar@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Phone (Optional)</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Subject</label>
                        <Input
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="e.g. Project Partnership / Zakat Sponsorship"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Message</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-md border border-slate-200 bg-white p-3 text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600 disabled:opacity-50"
                        placeholder="Please elaborate on your inquiry or community project request..."
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full sm:w-auto gap-2"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{status === 'submitting' ? 'Submitting...' : 'Send Message'}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
