import React from 'react';
import Link from 'next/link';
import { CalendarClock, ShieldCheck } from 'lucide-react';
import {
  isExpiringSoon,
  type MembershipStatus,
} from '../../lib/membership-client';

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function MembershipStatusCard({ membership }: { membership: MembershipStatus }) {
  if (!membership.isActive || !membership.subscription) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">You are not a member yet</h2>
            <p className="mt-1 max-w-prose text-sm text-slate-600">
              Pick a plan below to see phone numbers and send messages to professionals.
            </p>
            <Link
              href="/hire"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Keep browsing for free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const soon = isExpiringSoon(membership);
  return (
    <div
      className={`rounded-lg border p-5 ${
        soon ? 'border-accent/50 bg-accent-soft' : 'border-green-700/30 bg-green-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <CalendarClock
          className={`mt-0.5 h-5 w-5 ${soon ? 'text-accent-hover' : 'text-green-800'}`}
          aria-hidden="true"
        />
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Your membership is active
            {membership.subscription.plan?.name ? `: ${membership.subscription.plan.name}` : ''}
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Ends on <strong>{dateFmt(membership.subscription.expiresAt)}</strong>.{' '}
            <span className={soon ? 'font-semibold text-accent-hover' : ''}>
              {membership.daysRemaining} {membership.daysRemaining === 1 ? 'day' : 'days'} left.
            </span>
          </p>
          {soon && (
            <p className="mt-1 text-sm text-slate-700">
              Renew now to keep phone numbers and messages without a break.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

