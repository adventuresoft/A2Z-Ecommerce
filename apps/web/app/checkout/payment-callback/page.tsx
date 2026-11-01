"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import { CheckoutStepHeader } from "../../../components/Checkout/CheckoutStepHeader";
import { Tilt3DCard } from "../../../components/UI/Tilt3DCard";
import { apiClient, ApiError } from "../../../lib/api-client";

interface VerifyResult {
  verified: boolean;
  status: string;
  trx_id?: string;
  orderNumber: string;
  orderId?: string;
  message?: string;
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();

  const invoiceNumberParam =
    searchParams.get("invoice_number") ||
    searchParams.get("invoice") ||
    searchParams.get("orderNumber") ||
    searchParams.get("order_number") ||
    searchParams.get("order_id") ||
    "";

  const [invoiceInput, setInvoiceInput] = useState(invoiceNumberParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTrx, setCopiedTrx] = useState(false);

  const performVerification = useCallback(async (invoice: string) => {
    if (!invoice.trim()) {
      setErrorMessage("No invoice or order number provided to verify.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.post<VerifyResult>("/payments/paystation/verify", {
        invoice_number: invoice.trim(),
      });
      setResult(res);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to connect to verification server.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (invoiceNumberParam) {
      void performVerification(invoiceNumberParam);
    }
  }, [invoiceNumberParam, performVerification]);

  const handleCopyTrx = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTrx(true);
      setTimeout(() => setCopiedTrx(false), 2000);
    }
  };

  const isSuccess = Boolean(!loading && result && result.verified);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <CheckoutStepHeader currentStep={isSuccess ? 3 : 2} />

      {/* 1. Loading State */}
      {loading && (
        <div className="surface-3d rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Securing Settlement
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Verifying with PayStation…
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
              Please keep this tab open while we validate your encrypted payment receipt with the banking switch.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>256-Bit SSL Encrypted Handshake</span>
          </div>
        </div>
      )}

      {/* 2. Verified Success State */}
      {!loading && result && result.verified && (
        <Tilt3DCard maxTilt={3} scale={1.005}>
          <div className="surface-3d rounded-3xl overflow-hidden">
            {/* Dark Obsidian Celebratory Header */}
            <div className="surface-3d-dark bg-tech-grid p-8 sm:p-10 text-center text-white relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-300 rounded-2xl flex items-center justify-center mx-auto border border-emerald-400/40 shadow-lg mb-4">
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Payment Verified &amp; Confirmed</span>
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 text-white">
                Thank You! Payment Successful
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
                PayStation has verified your settlement and your order is now queued for official warranty dispatch.
              </p>
            </div>

            {/* Verified Receipt Table */}
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200/80 text-left space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Order / Invoice</span>
                  <span className="font-mono font-black text-sm text-blue-700 tabular-nums">
                    {result.orderNumber}
                  </span>
                </div>

                {result.trx_id && (
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 gap-2">
                    <span className="text-slate-500 font-semibold">Transaction ID (TrxID)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {result.trx_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTrx(result.trx_id || "")}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        aria-label="Copy Transaction ID"
                      >
                        {copiedTrx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Settlement Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    PAID • Verified Online
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Payment Gateway</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>PayStation Official Gateway</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={result.orderId ? `/account/orders/${result.orderId}` : "/account/orders"}
                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <span>View Order in Dashboard</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/shop"
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </Tilt3DCard>
      )}

      {/* 3. Processing State */}
      {!loading && result && !result.verified && result.status.toLowerCase() === "processing" && (
        <div className="surface-3d rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border-2 border-amber-200 shadow-xs">
            <Clock className="w-10 h-10" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Transaction Processing
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Payment Under Review
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
              PayStation is currently clearing your transaction with the issuing provider. This typically takes less than a minute.
            </p>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80 text-left space-y-2 text-xs text-amber-900">
            <p className="font-bold">
              Order Number: <span className="font-mono tabular-nums">{result.orderNumber}</span>
            </p>
            <p className="text-[11px] text-amber-800">
              If your wallet or bank card was debited, your order status will update automatically once clearing completes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => performVerification(result.orderNumber)}
              className="w-full sm:w-auto px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Refresh Payment Status</span>
            </button>
            <Link
              href="/account/orders"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Go to Account Orders
            </Link>
          </div>
        </div>
      )}

      {/* 4. Failed / Cancelled State */}
      {!loading && result && !result.verified && result.status.toLowerCase() !== "processing" && (
        <div className="surface-3d rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border-2 border-rose-200 shadow-xs">
            <AlertCircle className="w-10 h-10" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Payment Incomplete
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Payment Was Not Completed
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
              {result.message ||
                "The payment session was either cancelled or declined by the issuing provider."}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-2 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">Order Number</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {result.orderNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Gateway Status</span>
              <span className="font-bold text-rose-600">{result.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/checkout"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Retry Checkout</span>
            </Link>
            <Link
              href="/account/orders"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              View in Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* 5. Manual Lookup State */}
      {!loading && !result && (
        <div className="surface-3d rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PayStation Payment Status Inquiry
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
              Enter your Order Number or PayStation Invoice Number to query the latest verified status.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold text-left"
            >
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void performVerification(invoiceInput);
            }}
            className="space-y-3 max-w-md mx-auto text-left"
          >
            <label
              htmlFor="manual-invoice-input"
              className="text-xs font-bold text-slate-700 block"
            >
              Invoice / Order Number
            </label>
            <div className="flex gap-2">
              <input
                id="manual-invoice-input"
                name="invoice_number"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                placeholder="e.g. ORD-20261031-ABCD…"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs uppercase text-slate-900 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Verify
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3 text-xs">
            <Link
              href="/account"
              className="font-bold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
            >
              Back to My Account
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              •
            </span>
            <Link
              href="/shop"
              className="font-bold text-slate-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded px-1"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <StorefrontShell hideFooter={false}>
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <Loader2
              className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-xs font-bold text-slate-500">Loading payment details…</p>
          </div>
        }
      >
        <PaymentCallbackContent />
      </Suspense>
    </StorefrontShell>
  );
}
