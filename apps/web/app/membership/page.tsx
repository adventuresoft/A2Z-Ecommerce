'use client';

import React, { Suspense } from 'react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { MembershipPage } from '../../components/Membership/MembershipPage';
import { PageSkeleton } from '../../components/Marketplace/States';

export default function MembershipRoute() {
  return (
    <StorefrontShell>
      <main className="w-full flex-1">
        <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8"><PageSkeleton /></div>}>
          <MembershipPage />
        </Suspense>
      </main>
    </StorefrontShell>
  );
}

