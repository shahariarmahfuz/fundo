'use client';

import React, { Suspense } from 'react';
import { ProfileClient } from './ProfileClient';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading profile...</div>}>
      <ProfileClient defaultTab="overview" />
    </Suspense>
  );
}
