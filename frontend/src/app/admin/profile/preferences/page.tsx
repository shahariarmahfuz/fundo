'use client';

import React, { Suspense } from 'react';
import { ProfileClient } from '../ProfileClient';

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading preferences...</div>}>
      <ProfileClient defaultTab="preferences" />
    </Suspense>
  );
}
