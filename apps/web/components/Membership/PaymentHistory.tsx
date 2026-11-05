import React from 'react';
import {
  formatBdt,
  type MembershipHistory,
  type MembershipPaymentStatus,
} from '../../lib/membership-client';
import { EmptyState } from '../Marketplace/States';

const STATUS_STYLE: Record<MembershipPaymentStatus, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-green-50 text-green-800 ring-green-700/30' },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 ring-amber-700/30' },
  FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-800 ring-red-700/30' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-700 ring-slate-500/30' },
  REFUNDED: { label: 'Refunded', cls: 'bg-slate-100 text-slate-700 ring-slate-500/30' },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function PaymentHistory({ history }: { history: MembershipHistory }) {
  const payments = [...history.payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        body="Your payments will show here after you buy a plan."
        action={{ label: 'Choose a plan', href: '#plans' }}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">Payment history, newest first</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Date</th>
            <th scope="col" className="px-4 py-3 font-medium">Plan</th>
            <th scope="col" className="px-4 py-3 font-medium">Gateway</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p) => {
            const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
            return (
              <tr key={p.id}>
                <td className="px-4 py-3 text-slate-700">{fmt(p.paidAt ?? p.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.plan?.name ?? 'Membership'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    PayStation Online Gateway
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900 font-semibold">{formatBdt(p.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>
                    {s.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
