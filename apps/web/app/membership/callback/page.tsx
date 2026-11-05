'use client';

import React, { Suspense } from 'react';
import { StorefrontShell } from '../../../components/Shell/StorefrontShell';
import { PaymentResult } from '../../../components/Membership/PaymentResult';
import { PageSkeleton } from '../../../components/Marketplace/States';

export default function MembershipCallbackPage() {
  return (
    <StorefrontShell>
      <main className="w-full flex-1">
        <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-12"><PageSkeleton rows={1} /></div>}>
          <PaymentResult />
        </Suspense>
      </main>
    </StorefrontShell>
  );
}

