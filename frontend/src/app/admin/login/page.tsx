'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ApiClient } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fundo.org');
  const [password, setPassword] = useState('admin123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: any = await ApiClient.post('/auth/login', { email, password });
      if (data.access_token) {
        ApiClient.setToken(data.access_token);
        router.push('/admin');
      } else {
        throw new Error('No access token returned');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm mb-2">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Fundo Foundation Management System
          </h1>
          <p className="text-xs text-slate-500">
            Secure administrative and fiduciary access
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Staff Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="staff@fundo.org"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 text-xs"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <div className="text-[11px] text-slate-400">
                Demo Admin: <code className="text-teal-700 font-mono">admin@fundo.org</code> / <code className="text-teal-700 font-mono">admin123456</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
