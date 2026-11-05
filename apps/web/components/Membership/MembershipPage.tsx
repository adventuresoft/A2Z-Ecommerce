'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  membershipClient,
  type MembershipHistory,
  type MembershipPlan,
} from '../../lib/membership-client';
import { useMembership } from '../../lib/useMembership';
import { PricingSection } from './PricingSection';
import { MembershipStatusCard } from './MembershipStatusCard';
import { PaymentHistory } from './PaymentHistory';
import { ErrorState, PageSkeleton } from '../Marketplace/States';

export function MembershipPage() {
  const { isAuthenticated } = useAuth();
  const { membership, isMember, isLoading: membershipLoading, error: membershipError, refresh } =
    useMembership();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [history, setHistory] = useState<MembershipHistory | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const data = await membershipClient.getPlans();
      setPlans([...data].filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err: any) {
      setPlansError(err?.message || 'Could not load plans.');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory(null);
      return;
    }
    membershipClient
      .getHistory()
      .then((h) => {
        setHistory(h);
        setHistoryError(null);
      })
      .catch((err: any) => setHistoryError(err?.message || 'Could not load your payments.'));
  }, [isAuthenticated]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Membership</h1>
        <p className="mt-1 max-w-prose text-sm text-slate-600">
          Browse professionals for free. A plan lets you see phone numbers and send messages.
        </p>
      </header>

      {isAuthenticated && (
        <section aria-label="Your membership" className="mb-8">
          {membershipLoading ? (
            <PageSkeleton rows={1} />
          ) : membershipError ? (
            <ErrorState message={membershipError} onRetry={refresh} />
          ) : (
            membership && <MembershipStatusCard membership={membership} />
          )}
        </section>
      )}

      <section id="plans" aria-labelledby="plans-h" className="mb-10 scroll-mt-4">
        <h2 id="plans-h" className="mb-3 text-lg font-semibold text-slate-900">
          {isMember ? 'Renew your plan' : 'Choose a plan'}
        </h2>
        {plansLoading ? (
          <PageSkeleton rows={3} />
        ) : (
          <PricingSection
            plans={plans}
            isMember={isMember}
            error={plansError}
            onRetry={loadPlans}
          />
        )}
      </section>

      {isAuthenticated && (
        <section aria-labelledby="history-h">
          <h2 id="history-h" className="mb-3 text-lg font-semibold text-slate-900">
            Payment history
          </h2>
          {historyError ? (
            <ErrorState message={historyError} />
          ) : history ? (
            <PaymentHistory history={history} />
          ) : (
            <PageSkeleton rows={2} />
          )}
        </section>
      )}
    </div>
  );
}

