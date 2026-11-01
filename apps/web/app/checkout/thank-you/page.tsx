"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PackageCheck, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { StorefrontShell } from "../../../components/Shell/StorefrontShell";
import {
  OrderThankYouView,
  ThankYouOrderData,
} from "../../../components/Checkout/OrderThankYouView";
import { CheckoutStepHeader } from "../../../components/Checkout/CheckoutStepHeader";
import { apiClient } from "../../../lib/api-client";

function ThankYouPageContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId") || "";
  const orderNumberParam = searchParams.get("orderNumber") || "";

  const [order, setOrder] = useState<ThankYouOrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      // 1. Check sessionStorage cache from fresh checkout placement
      if (typeof window !== "undefined") {
        try {
          const cached = window.sessionStorage.getItem("az_last_order");
          if (cached) {
            const parsed = JSON.parse(cached) as ThankYouOrderData;
            if (
              (!orderIdParam && !orderNumberParam) ||
              parsed.id === orderIdParam ||
              parsed.orderNumber === orderNumberParam
            ) {
              if (isMounted) {
                setOrder(parsed);
                setLoading(false);
              }
              return;
            }
          }
        } catch {
          // Ignore malformed session data
        }
      }

      // 2. Fallback: fetch from API if orderId is in query string
      if (orderIdParam) {
        try {
          const fetched = await apiClient.get<ThankYouOrderData>(`/orders/${orderIdParam}`);
          if (isMounted && fetched) {
            setOrder(fetched);
            setLoading(false);
            return;
          }
        } catch {
          // Handled by generic confirmation view below
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderIdParam, orderNumberParam]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" aria-hidden="true" />
        <p className="text-xs font-bold text-slate-500">Preparing your verified order receipt…</p>
      </div>
    );
  }

  if (order) {
    return <OrderThankYouView order={order} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <CheckoutStepHeader currentStep={3} />
      <div className="surface-3d rounded-3xl p-8 sm:p-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <PackageCheck className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Order Received
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thank You for Shopping with Us!
          </h1>
          {orderNumberParam && (
            <p className="text-xs font-bold text-slate-700">
              Reference: <span className="font-mono text-blue-700">{orderNumberParam}</span>
            </p>
          )}
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            You can view live courier updates, official warranty serials, and downloadable receipts inside your customer dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/account/orders"
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>Open My Orders</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutThankYouPage() {
  return (
    <StorefrontShell hideFooter={false}>
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-4 py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-xs font-bold text-slate-500">Loading confirmation…</p>
          </div>
        }
      >
        <ThankYouPageContent />
      </Suspense>
    </StorefrontShell>
  );
}

