'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Copy,
  Check,
  CreditCard,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  membershipClient,
  formatBdt,
  type MembershipCallbackResult,
} from '../../lib/membership-client';
import { useAuth } from '../../context/AuthContext';
import { PageSkeleton } from '../Marketplace/States';

type Outcome =
  | { kind: 'loading' }
  | { kind: 'success'; result: MembershipCallbackResult }
  | { kind: 'failed' | 'cancelled'; message: string }
  | { kind: 'error'; message: string };

export function PaymentResult() {
  const params = useSearchParams();
  const { isLoading: authLoading } = useAuth();
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'loading' });
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState(false);
  const started = useRef(false);

  const paymentId = params.get('paymentId');
  const status = params.get('status');
  const invoiceNumber = params.get('invoice_number');
  const trxId = params.get('trx_id');

  useEffect(() => {
    if (authLoading || started.current) return;
    started.current = true;

    if (!paymentId) {
      setOutcome({
        kind: 'error',
        message: 'This page requires a valid payment identifier from PayStation Online Gateway.',
      });
      return;
    }

    membershipClient
      .confirmCallback({
        paymentId,
        status,
        invoice_number: invoiceNumber,
        trx_id: trxId,
      })
      .then((result) => {
        if (result.success) {
          setOutcome({ kind: 'success', result });
        } else if (status?.toLowerCase().includes('cancel')) {
          setOutcome({ kind: 'cancelled', message: result.message });
        } else {
          setOutcome({ kind: 'failed', message: result.message });
        }
      })
      .catch((err: any) =>
        setOutcome({
          kind: 'error',
          message:
            err?.message ||
            'We could not verify your payment with PayStation. Please check your payment history.',
        }),
      );
  }, [authLoading, paymentId, status, invoiceNumber, trxId]);

  const copyToClipboard = (text: string, type: 'invoice' | 'trx') => {
    navigator.clipboard.writeText(text);
    if (type === 'invoice') {
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    } else {
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2000);
    }
  };

  if (outcome.kind === 'loading') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center" aria-live="polite">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CreditCard className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">PayStation পেমেন্ট যাচাই করা হচ্ছে...</h2>
        <p className="mt-1 text-sm text-slate-500">
          Verifying your transaction with PayStation Online Gateway. Please do not close or refresh this window.
        </p>
        <div className="mt-6">
          <PageSkeleton rows={1} />
        </div>
      </div>
    );
  }

  if (outcome.kind === 'success') {
    const sub = outcome.result.subscription;
    const expires = sub?.expiresAt
      ? new Date(sub.expiresAt).toLocaleDateString('bn-BD', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

    const displayedInvoice = invoiceNumber || outcome.result.payment?.id || 'MEM-N/A';
    const displayedTrx = trxId || (outcome.result.payment as any)?.gatewayTxnId || 'PS-VERIFIED';

    return (
      <div className="mx-auto max-w-xl px-4 py-12" role="status">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-500/5">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-8 text-center text-white sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              PayStation Online Gateway • Verified
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">পেমেন্ট সফল হয়েছে!</h1>
            <p className="mt-1 text-sm text-emerald-100">
              আপনার সদস্যপদ সফলভাবে সক্রিয় করা হয়েছে (Membership Activated)
            </p>
          </div>

          {/* Details Card */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-medium text-slate-500">পেমেন্ট মেথড (Gateway)</span>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                  PayStation Online Gateway
                </span>
              </div>

              {sub?.plan && (
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-medium text-slate-500">প্ল্যানের নাম (Plan)</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {sub.plan.name}
                  </span>
                </div>
              )}

              {outcome.result.payment?.amount && (
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <span className="text-xs font-medium text-slate-500">পরিশোধিত অর্থ (Amount Paid)</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatBdt(outcome.result.payment.amount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-medium text-slate-500">ইনভয়েস নম্বর (Invoice)</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {displayedInvoice}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(displayedInvoice, 'invoice')}
                    className="text-slate-400 hover:text-slate-700 transition"
                    title="Copy Invoice"
                  >
                    {copiedInvoice ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-medium text-slate-500">ট্রানজেকশন আইডি (Trx ID)</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {displayedTrx}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(displayedTrx, 'trx')}
                    className="text-slate-400 hover:text-slate-700 transition"
                    title="Copy Trx ID"
                  >
                    {copiedTrx ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {expires && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-500">মেয়াদকাল (Valid Until)</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {expires}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/hire"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                পেশাজীবী খুঁজুন (Browse)
              </Link>
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                মেম্বারশিপ ড্যাশবোর্ড
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const heading =
    outcome.kind === 'cancelled'
      ? 'পেমেন্ট বাতিল করা হয়েছে (Payment Cancelled)'
      : outcome.kind === 'failed'
        ? 'পেমেন্ট সম্পন্ন হয়নি (Payment Incomplete)'
        : 'পেমেন্ট যাচাই করা যায়নি (Verification Failed)';

  return (
    <div className="mx-auto max-w-lg px-4 py-12" role="alert">
      <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl shadow-red-500/5">
        <div className="bg-red-600 px-6 py-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            PayStation Online Gateway
          </div>
          <h1 className="mt-2 text-xl font-bold">{heading}</h1>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <p className="text-sm text-slate-600 text-center">
            {outcome.message} এই প্রচেষ্টায় আপনার অ্যাকাউন্ট থেকে কোনো টাকা কাটা হয়নি বা মেম্বারশিপ যুক্ত হয়নি।
          </p>

          {invoiceNumber && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
              <span className="text-xs text-slate-500">ইনভয়েস রেফারেন্স:</span>{' '}
              <code className="text-xs font-mono font-bold text-slate-800">{invoiceNumber}</code>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/membership#plans"
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover transition"
            >
              আবার চেষ্টা করুন (Try Again)
            </Link>
            <Link
              href="/hire"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              মার্কেটপ্লেসে ফিরুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
