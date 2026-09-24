'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDonationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/sadaqa');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
      Redirecting to Sadaqa / Donations module...
    </div>
  );
}
