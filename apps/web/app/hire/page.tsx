'use client';

import React, { Suspense } from 'react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { MarketplaceDirectory } from '../../components/Marketplace/MarketplaceDirectory';
import { PageSkeleton } from '../../components/Marketplace/States';

export default function HirePage() {
  return (
    <StorefrontShell>
      <main className="w-full flex-1">
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><PageSkeleton /></div>}>
          <MarketplaceDirectory />
        </Suspense>
      </main>
    </StorefrontShell>
  );
}

