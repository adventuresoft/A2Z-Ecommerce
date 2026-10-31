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
  ShoppingBag,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
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

  // Extract parameters sent back by PayStation gateway redirect
  const invoiceNumberParam =
    searchParams.get("invoice_number") ||
    searchParams.get("invoice") ||
    searchParams.get("orderNumber") ||
    searchParams.get("order_number") ||
    searchParams.get("order_id") ||
    "";

  const rawStatusParam = searchParams.get("status") || "";
  const rawTrxIdParam = searchParams.get("trx_id") || "";

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

  // Automatically trigger verification on mount if invoice_number is present in URL
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      {/* 1. Loading State */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-60" />
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Securing Payment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Verifying with PayStation…
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
              Please do not close or refresh this page. We are securely communicating with the banking gateway to confirm your payment.
            </p>
          </div>
          <div className="inline-flex items-center space-x-2 text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>256-Bit SSL Encrypted Verification</span>
          </div>
        </div>
      )}

      {/* 2. Success State */}
      {!loading && result && result.verified && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-sm animate-bounce duration-1000">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>

          <div>
            <span className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Payment Verified & Confirmed</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Payment Successful!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
              Your transaction has been securely processed by PayStation and your order status is now confirmed.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-left space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Order / Invoice</span>
              <span className="font-mono font-black text-sm text-blue-700">
                {result.orderNumber}
              </span>
            </div>

            {result.trx_id && (
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Transaction ID (TrxID)</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {result.trx_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTrx(result.trx_id || "")}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                    title="Copy Transaction ID"
                    aria-label="Copy Transaction ID"
                  >
                    {copiedTrx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Payment Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                PAID • Verified Online
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Payment Gateway</span>
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>PayStation Official Sandbox</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <span>View Orders in Dashboard</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* 3. Processing State */}
      {!loading && result && !result.verified && result.status.toLowerCase() === "processing" && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 shadow-sm">
            <Clock className="w-10 h-10 animate-pulse" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Transaction Processing
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Payment Under Review
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
              PayStation is currently processing your transaction with the provider. This typically takes a few moments.
            </p>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/80 text-left space-y-2 text-xs text-amber-900">
            <p className="font-bold">Order Number: <span className="font-mono">{result.orderNumber}</span></p>
            <p className="text-[11px] text-amber-800">
              If your bank or wallet deducted funds, your order status will automatically update once the gateway finalizes clearing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => performVerification(result.orderNumber)}
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refresh Payment Status</span>
            </button>
            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Go to Account Orders
            </Link>
          </div>
        </div>
      )}

      {/* 4. Failed / Cancelled State */}
      {!loading && result && !result.verified && result.status.toLowerCase() !== "processing" && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-rose-100 shadow-sm">
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
              {result.message || "The payment session was either cancelled by the user or rejected by the issuing provider."}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-2 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-500">Order Number</span>
              <span className="font-mono font-bold text-slate-900">{result.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">Gateway Status</span>
              <span className="font-bold text-rose-600">{result.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/checkout"
              className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Checkout</span>
            </Link>
            <Link
              href="/account"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              View in Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* 5. Manual Lookup State (If visited without query parameters or after general error) */}
      {!loading && !result && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
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
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold text-left">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3 max-w-md mx-auto text-left">
            <label htmlFor="manual-invoice-input" className="text-xs font-bold text-slate-700 block">
              Invoice / Order Number
            </label>
            <div className="flex gap-2">
              <input
                id="manual-invoice-input"
                type="text"
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                placeholder="e.g. ORD-20261031-ABCD"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs uppercase text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => performVerification(invoiceInput)}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Verify
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-3 text-xs">
            <Link href="/account" className="font-bold text-blue-700 hover:underline">
              Back to My Account
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/shop" className="font-bold text-slate-600 hover:underline">
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading payment details…</p>
          </div>
        }
      >
        <PaymentCallbackContent />
      </Suspense>
    </StorefrontShell>
  );
}
