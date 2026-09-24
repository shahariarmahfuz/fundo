'use client';

import React, { Suspense } from 'react';
import { ProfileClient } from '../ProfileClient';

export default function ManageProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading manage profile...</div>}>
      <ProfileClient defaultTab="manage" />
    </Suspense>
  );
}
