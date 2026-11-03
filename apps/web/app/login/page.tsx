'use client';

import React, { Suspense } from 'react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { UnifiedAuthCard } from '../../components/Auth/UnifiedAuthCard';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <StorefrontShell>
      <section className="w-full flex-1 bg-[#F4F6F9] py-5 sm:py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
        <div style={{ maxWidth: '420px', width: '100%' }} className="w-full max-w-[420px] mx-auto">
          <Suspense
            fallback={
              <div className="bg-white rounded-2xl border border-slate-200/90 p-10 flex items-center justify-center shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A00]" />
              </div>
            }
          >
            <UnifiedAuthCard initialView="phone-input" redirectTo="/" />
          </Suspense>
        </div>
      </section>
    </StorefrontShell>
  );
}
