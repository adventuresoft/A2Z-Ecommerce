"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useSafeReducedMotion } from "../../lib/useSafeReducedMotion";
import {
  PackageCheck,
  Copy,
  Check,
  Calendar,
  MapPin,
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tilt3DCard } from "../UI/Tilt3DCard";
import { CheckoutStepHeader } from "./CheckoutStepHeader";
import { formatBDT } from "../../data/mock-catalog";

export interface ThankYouOrderItem {
  id: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ThankYouOrderData {
  id: string;
  orderNumber: string;
  grandTotal: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  recipientName: string;
  recipientPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState?: string | null;
  shippingPostalCode: string;
  paymentMethod?: string;
  paymentReference?: string | null;
  items: ThankYouOrderItem[];
  createdAt: string;
  estimatedDeliveryLabel?: string;
}

interface OrderThankYouViewProps {
  order: ThankYouOrderData;
  warningMessage?: string | null;
}

const FULFILLMENT_ROADMAP = [
  {
    title: "Order Confirmed",
    desc: "Logged in warehouse queue",
    done: true,
    active: true,
  },
  {
    title: "QC & Warranty Seal",
    desc: "Serial & official seal check",
    done: false,
    active: false,
  },
  {
    title: "Courier Dispatch",
    desc: "Handed to express rider",
    done: false,
    active: false,
  },
  {
    title: "Doorstep Delivery",
    desc: "Inspect & receive parcel",
    done: false,
    active: false,
  },
];

export function OrderThankYouView({ order, warningMessage }: OrderThankYouViewProps) {
  const prefersReducedMotion = useSafeReducedMotion();
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const isDhaka =
    (order.shippingState || "").toLowerCase().includes("dhaka") ||
    ((order.shippingCity || "").toLowerCase().includes("dhaka") &&
      !(order.shippingCity || "").toLowerCase().includes("outside"));

  const deliveryEta =
    order.estimatedDeliveryLabel ||
    (isDhaka ? "24–48 Hours (Dhaka Metro)" : "3–5 Working Days (Nationwide)");

  const paymentLabel =
    order.paymentMethod === "PAYSTATION"
      ? "PayStation Online Gateway"
      : order.paymentMethod === "MOBILE_BANKING"
        ? "bKash / Nagad Mobile Banking (Verification Queued)"
        : "Cash on Delivery (COD)";

  const handleCopyOrderNumber = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <CheckoutStepHeader currentStep={3} />

      {warningMessage && (
        <div
          role="alert"
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Celebratory Hero Banner */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl surface-3d-dark bg-tech-grid text-white p-6 sm:p-10 mb-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-950/40">
              <PackageCheck className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Order Confirmed &amp; Queued</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Thank You, {order.recipientName.split(" ")[0] || "Valued Customer"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Your order has been registered with our Dhaka fulfillment hub. Every device undergoes official serial verification before dispatch.
              </p>
            </div>
          </div>

          {/* Copyable Order Number 3D Pod */}
          <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Official Order Reference
            </span>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="font-mono text-base sm:text-lg font-black text-white tabular-nums">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                aria-label="Copy order number"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {copiedOrderNo ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold mt-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ETA: {deliveryEta}</span>
            </span>
          </div>
        </div>

        {/* 4-Step Live Fulfillment Roadmap */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FULFILLMENT_ROADMAP.map((step, index) => (
              <div
                key={step.title}
                className={`rounded-2xl p-3.5 border ${step.done
                    ? "bg-emerald-500/15 border-emerald-400/35"
                    : "bg-white/5 border-white/10"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center tabular-nums ${step.done
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-white/10 text-slate-300"
                      }`}
                    aria-hidden="true"
                  >
                    {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : `0${index + 1}`}
                  </span>
                  <span
                    className={`text-xs font-extrabold ${step.done ? "text-emerald-200" : "text-slate-200"
                      }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pl-8">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid: 3D Verified Receipt + Delivery & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left 7 Cols: Itemized Invoice Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="surface-3d rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Verified Order Summary</h2>
                  <p className="text-[11px] text-slate-500 font-medium tabular-nums">
                    Placed on{" "}
                    {new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full tabular-nums">
                {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 1} Item(s)
              </span>
            </div>

            {/* Line Items */}
            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.productTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 tabular-nums">
                        SKU: <span className="font-mono">{item.sku}</span> • Qty: {item.quantity} ×{" "}
                        {formatBDT(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 shrink-0 tabular-nums">
                      {formatBDT(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatBDT(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Courier &amp; Handling</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {order.shippingFee === 0 ? "FREE" : formatBDT(order.shippingFee)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Promotional Savings</span>
                  <span className="tabular-nums">-{formatBDT(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-black text-slate-900 block">Total Payable</span>
                  <span className="text-[10px] text-slate-400">Inclusive of applicable VAT</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-blue-700 tabular-nums">
                  {formatBDT(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: 3D Tilt Shipping & Payment Pod + CTAs */}
        <div className="lg:col-span-5 space-y-5">
          <Tilt3DCard maxTilt={5} scale={1.01}>
            <div className="surface-3d rounded-3xl p-6 space-y-5">
              {/* Destination */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="text-xs space-y-1 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Delivery Destination
                  </span>
                  <p className="font-black text-slate-900 text-sm">{order.recipientName}</p>
                  <p className="font-semibold text-slate-600 tabular-nums">{order.recipientPhone}</p>
                  <p className="text-slate-600 leading-relaxed">
                    {order.shippingStreet}, {order.shippingCity}
                    {order.shippingState ? `, ${order.shippingState}` : ""} –{" "}
                    <span className="tabular-nums">{order.shippingPostalCode}</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="text-xs space-y-1 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Payment Settlement
                  </span>
                  <p className="font-black text-slate-900">{paymentLabel}</p>
                  {order.paymentReference && (
                    <p className="font-mono text-[11px] text-slate-600 break-all">
                      {order.paymentReference}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>100% Genuine Brand Warranty Registered</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>SMS &amp; Dashboard tracking updates enabled</span>
                </div>
              </div>
            </div>
          </Tilt3DCard>

          {/* Primary Navigation CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href={order.id ? `/account/orders/${order.id}` : "/account/orders"}
              className="w-full py-3.5 px-5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-[background-color,box-shadow,transform] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Truck className="w-4 h-4" aria-hidden="true" />
              <span>Track Order in Dashboard</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              href="/shop"
              className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Continue Exploring Gadgets</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

