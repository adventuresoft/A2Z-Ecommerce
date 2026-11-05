'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  durationLabel,
  formatBdt,
  membershipClient,
  perMonthPrice,
  planFeatureList,
  type MembershipPlan,
} from '../../lib/membership-client';
import { loginUrlFor } from '../../lib/useRequireAuth';
import { EmptyState, ErrorState } from '../Marketplace/States';

export function PricingSection({
  plans,
  isMember,
  error,
  onRetry,
}: {
  plans: MembershipPlan[];
  isMember: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const bestValueId = [...plans].sort((a, b) => perMonthPrice(a) - perMonthPrice(b))[0]?.id;
  const monthly = plans.length > 1;

  const buy = async (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      router.push(loginUrlFor('/membership'));
      return;
    }
    setBusyPlan(plan.id);
    setCheckoutError(null);
    try {
      const res = await membershipClient.checkout(plan.id);
      window.location.assign(res.paymentUrl);
    } catch (err: any) {
      setCheckoutError(err?.message || 'Could not start the payment.');
      setBusyPlan(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (plans.length === 0) {
    return (
      <EmptyState
        title="Plans are not available yet"
        body="Membership plans will appear here soon. You can still browse professionals for free."
        action={{ label: 'Browse professionals', href: '/hire' }}
      />
    );
  }

  return (
    <div>
      {checkoutError && (
        <div className="mb-3">
          <ErrorState message={checkoutError} />
        </div>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {plans.map((plan) => {
          const features = planFeatureList(plan);
          const best = monthly && plan.id === bestValueId;
          return (
            <li
              key={plan.id}
              className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                  {best && (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-700/30">
                      Best value
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  {durationLabel(plan.durationDays)} of access
                  {monthly && ` · about ${formatBdt(perMonthPrice(plan))} a month`}
                </p>
                {features.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-2xl font-semibold tabular-nums text-slate-900 sm:text-right">
                {formatBdt(plan.price)}
              </p>

              <button
                type="button"
                onClick={() => buy(plan)}
                disabled={busyPlan !== null}
                className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                {busyPlan === plan.id
                  ? 'Starting payment…'
                  : isMember
                    ? 'Renew with this plan'
                    : 'Buy plan'}
              </button>
            </li>
          );
        })}
      </ul>
      {isMember && (
        <p className="mt-2 text-sm text-slate-600">
          Renewing adds the new plan after your current term ends. You do not lose any days.
        </p>
      )}
    </div>
  );
}

