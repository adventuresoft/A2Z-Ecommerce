'use client';

import React, { Suspense, use } from 'react';
import { StorefrontShell } from '../../../components/Shell/StorefrontShell';
import { FreelancerProfileView } from '../../../components/Marketplace/FreelancerProfileView';
import { PageSkeleton } from '../../../components/Marketplace/States';

export default function HireProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <StorefrontShell>
      <main className="w-full flex-1">
        <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8"><PageSkeleton rows={3} /></div>}>
          <FreelancerProfileView id={id} />
        </Suspense>
      </main>
    </StorefrontShell>
  );
}

