"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSafeReducedMotion } from "../../lib/useSafeReducedMotion";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  MapPin,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { CheckoutStepHeader } from "../../components/Checkout/CheckoutStepHeader";
import { Tilt3DCard } from "../../components/UI/Tilt3DCard";
import { useStore } from "../../context/StoreContext";
import { formatBDT } from "../../data/mock-catalog";
import { apiClient, ApiError } from "../../lib/api-client";

const FREE_SHIPPING_THRESHOLD = 100000;

interface CalculationState {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalTaxAmount: number;
  grandTotal: number;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    description?: string | null;
  } | null;
  itemsValidation: Array<{
    variantId: string;
    isValid: boolean;
    availableQuantity: number;
    errorMessage?: string;
  }>;
  isEligibleForCheckout: boolean;
}

export interface ShippingZoneItem {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  methodsCount?: number;
}

export interface ShippingMethodItem {
  id: string;
  zoneId: string;
  zoneName?: string;
  name: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
  sortOrder: number;
}

const FALLBACK_SHIPPING_ZONES: ShippingZoneItem[] = [
  {
    id: "zone-dhaka",
    name: "Inside Dhaka",
    description: "Dhaka city metropolitan area",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "zone-outside",
    name: "Outside Dhaka",
    description: "Nationwide delivery across all divisions",
    isActive: true,
    sortOrder: 2,
  },
];

const FALLBACK_SHIPPING_METHODS: ShippingMethodItem[] = [
  {
    id: "method-std-dhaka",
    zoneId: "zone-dhaka",
    name: "Standard Delivery",
    cost: 60,
    estimatedDays: 2,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "method-exp-dhaka",
    zoneId: "zone-dhaka",
    name: "Express Next-Day Delivery",
    cost: 150,
    estimatedDays: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "method-std-outside",
    zoneId: "zone-outside",
    name: "Standard Delivery (Outside Dhaka)",
    cost: 120,
    estimatedDays: 3,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "method-exp-outside",
    zoneId: "zone-outside",
    name: "Express Priority (Outside Dhaka)",
    cost: 210,
    estimatedDays: 2,
    isActive: true,
    sortOrder: 2,
  },
];

interface SyncedCalculation extends CalculationState {
  calculatedSyncKey: string;
}

export default function CartPage() {
  const router = useRouter();
  const prefersReducedMotion = useSafeReducedMotion();
  const { cart, updateQuantity, removeFromCart, clearCart, totalCartPrice } = useStore();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [couponError, setCouponError] = useState("");
  const [shippingZones, setShippingZones] = useState<ShippingZoneItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(true);
  const [calculation, setCalculation] = useState<SyncedCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Fetch Delivery Zones and Shipping Methods
  useEffect(() => {
    let isMounted = true;
    async function loadShippingData() {
      try {
        setIsLoadingShipping(true);
        const [zonesRes, methodsRes] = await Promise.allSettled([
          apiClient.get<ShippingZoneItem[]>("/shipping/zones"),
          apiClient.get<ShippingMethodItem[]>("/shipping/methods"),
        ]);

        if (!isMounted) return;

        const loadedZones =
          zonesRes.status === "fulfilled" && Array.isArray(zonesRes.value) && zonesRes.value.length > 0
            ? zonesRes.value.sort((a, b) => a.sortOrder - b.sortOrder)
            : FALLBACK_SHIPPING_ZONES;

        const loadedMethods =
          methodsRes.status === "fulfilled" && Array.isArray(methodsRes.value) && methodsRes.value.length > 0
            ? methodsRes.value.sort((a, b) => a.sortOrder - b.sortOrder)
            : FALLBACK_SHIPPING_METHODS;

        setShippingZones(loadedZones);
        setShippingMethods(loadedMethods);

        // Hydrate from localStorage or select defaults
        const savedZoneId = window.localStorage.getItem("az_shipping_zone_id");
        const savedMethodId = window.localStorage.getItem("az_shipping_method_id");

        const targetZone = loadedZones.find((z) => z.id === savedZoneId) || loadedZones[0];
        const targetZoneId = targetZone ? targetZone.id : "";
        setSelectedZoneId(targetZoneId);

        const methodsForZone = loadedMethods.filter((m) => m.zoneId === targetZoneId);
        const targetMethod = methodsForZone.find((m) => m.id === savedMethodId) || methodsForZone[0];
        const targetMethodId = targetMethod ? targetMethod.id : "";
        setSelectedMethodId(targetMethodId);
      } catch (err) {
        console.warn("Failed to load shipping data for cart, using fallback list:", err);
        if (isMounted) {
          setShippingZones(FALLBACK_SHIPPING_ZONES);
          setShippingMethods(FALLBACK_SHIPPING_METHODS);
          setSelectedZoneId(FALLBACK_SHIPPING_ZONES[0]?.id || "");
          setSelectedMethodId(FALLBACK_SHIPPING_METHODS[0]?.id || "");
        }
      } finally {
        if (isMounted) {
          setIsLoadingShipping(false);
        }
      }
    }

    loadShippingData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hydrate persisted coupon from storage on mount
  useEffect(() => {
    try {
      const savedCoupon = window.sessionStorage.getItem("az_applied_coupon");
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon) as { code: string; discount: number };
        if (parsed?.code) {
          setAppliedCoupon(parsed);
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    try {
      window.localStorage.setItem("az_shipping_zone_id", zoneId);
    } catch {
      // Ignore storage write issues
    }
    const methodsForZone = shippingMethods.filter((m) => m.zoneId === zoneId);
    const firstMethodId = methodsForZone[0]?.id || "";
    setSelectedMethodId(firstMethodId);
    if (firstMethodId) {
      try {
        window.localStorage.setItem("az_shipping_method_id", firstMethodId);
      } catch {
        // Ignore storage write issues
      }
    }
  };

  const handleMethodChange = (methodId: string) => {
    setSelectedMethodId(methodId);
    try {
      window.localStorage.setItem("az_shipping_method_id", methodId);
    } catch {
      // Ignore storage write issues
    }
  };

  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId);
  const isDhaka = selectedZone
    ? selectedZone.name.toLowerCase().includes("dhaka") &&
    !selectedZone.name.toLowerCase().includes("outside")
    : true;
  const methodsForSelectedZone = shippingMethods.filter((m) => m.zoneId === selectedZoneId);
  const selectedMethod =
    methodsForSelectedZone.find((m) => m.id === selectedMethodId) || methodsForSelectedZone[0];

  const currentSyncKey = `${selectedZoneId}:${selectedMethod?.id || "none"}`;

  // Authoritative live calculation from server
  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    let isMounted = true;
    setIsCalculating(true);

    const calculateCart = async () => {
      try {
        const payload = {
          items: cart.map((item) => ({
            variantId: item.variantId || item.id,
            quantity: item.quantity,
          })),
          shippingCity: isDhaka ? "Dhaka" : "Chittagong",
          shippingMethodId: selectedMethod?.id || undefined,
          couponCode: appliedCoupon?.code || undefined,
        };

        const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
        if (isMounted) {
          setCalculation({ ...res, calculatedSyncKey: currentSyncKey });
          if (res.coupon && appliedCoupon) {
            const updatedCoupon = { code: res.coupon.code, discount: res.discountAmount };
            setAppliedCoupon(updatedCoupon);
            try {
              window.sessionStorage.setItem("az_applied_coupon", JSON.stringify(updatedCoupon));
            } catch {
              // Ignore
            }
          }
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const message = err instanceof Error ? err.message : "Applied coupon is no longer eligible.";
        if (appliedCoupon && status === 400 && isMounted) {
          setAppliedCoupon(null);
          setCouponError(message);
          try {
            window.sessionStorage.removeItem("az_applied_coupon");
          } catch {
            // Ignore
          }
        } else if (isMounted) {
          setCalculation(null);
        }
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(calculateCart, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cart, selectedZoneId, selectedMethod?.id, appliedCoupon?.code, isDhaka, currentSyncKey]);

  // Instant zero-latency financial totals
  const subtotal = calculation ? calculation.subtotal : totalCartPrice;
  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const defaultMethodCost = selectedMethod ? Number(selectedMethod.cost) : isDhaka ? 60 : 120;
  const baseShippingFee = isFreeShippingEligible ? 0 : defaultMethodCost;
  const shippingFee = calculation ? calculation.shippingFee : baseShippingFee;
  const couponDiscount = calculation ? calculation.discountAmount : appliedCoupon?.discount || 0;
  const grandTotal = calculation
    ? calculation.grandTotal
    : Math.max(0, subtotal - couponDiscount + shippingFee);

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const totalUnitCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Coupon handling
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity,
        })),
        shippingCity: isDhaka ? "Dhaka" : "Chittagong",
        shippingMethodId: selectedMethod?.id || undefined,
        couponCode: code,
      };

      const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
      setCalculation({ ...res, calculatedSyncKey: currentSyncKey });
      const nextCoupon = { code, discount: res.discountAmount };
      setAppliedCoupon(nextCoupon);
      try {
        window.sessionStorage.setItem("az_applied_coupon", JSON.stringify(nextCoupon));
      } catch {
        // Ignore
      }
      setCouponCode("");
      setCouponError("");
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid coupon code.";
      setCouponError(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    try {
      window.sessionStorage.removeItem("az_applied_coupon");
    } catch {
      // Ignore
    }
  };

  const validationMap = new Map(
    (calculation?.itemsValidation || []).map((v) => [v.variantId, v])
  );
  const canProceedToCheckout = calculation ? calculation.isEligibleForCheckout : true;

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-5"
        >
          <Link
            href="/"
            className="hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-bold" aria-current="page">
            Shopping Cart
          </span>
        </nav>

        {/* 3-Step Visual Checkout Progress */}
        <CheckoutStepHeader currentStep={1} />

        {/* Page Title & Basket Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/90">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Your Tech Basket
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {cart.length > 0 ? (
                <>
                  Review <span className="tabular-nums font-bold text-slate-800">{totalUnitCount}</span>{" "}
                  genuine item{totalUnitCount === 1 ? "" : "s"} before express checkout.
                </>
              ) : (
                "Your shopping basket is currently empty."
              )}
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Basket</span>
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Free Shipping Meter + Cart Items */}
            <div className="lg:col-span-8 space-y-5">
              {/* Free Shipping Unlock Meter */}
              <div className="surface-3d rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2.5">
                  {amountToFreeShipping === 0 ? (
                    <div className="flex items-center gap-2 font-black text-emerald-700">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span>Privilege Unlocked: FREE Nationwide Courier Delivery!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span>
                        Add{" "}
                        <strong className="font-black text-blue-700 tabular-nums">
                          {formatBDT(amountToFreeShipping)}
                        </strong>{" "}
                        more to unlock <strong className="text-slate-900">FREE Nationwide Shipping</strong>
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] font-black text-slate-500 tabular-nums">
                    {freeShippingProgress}%
                  </span>
                </div>

                <div
                  className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={freeShippingProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Free shipping threshold progress"
                >
                  <div
                    className={`h-full rounded-full transition-[width,background-color] duration-300 ${amountToFreeShipping === 0
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600"
                      }`}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Cart Items Surface */}
              <div className="surface-3d rounded-3xl divide-y divide-slate-100 overflow-hidden">
                <AnimatePresence initial={false}>
                  {cart.map((item) => {
                    const lineTotal = item.price * item.quantity;
                    const itemValidation = validationMap.get(item.variantId || item.id);

                    return (
                      <motion.div
                        key={item.id}
                        layout={!prefersReducedMotion}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Product Thumbnail & Meta */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Link
                            href={`/products/${item.product.slug || item.product.id}`}
                            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-2 group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <Image
                              src={item.product.image}
                              alt={item.product.title}
                              fill
                              className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                              sizes="96px"
                            />
                          </Link>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                {item.product.category}
                              </span>
                              {item.product.brand && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {item.product.brand}
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/products/${item.product.slug || item.product.id}`}
                              className="text-sm sm:text-base font-black text-slate-900 hover:text-blue-700 transition-colors line-clamp-2 block focus-visible:outline-none focus-visible:underline"
                            >
                              {item.product.title}
                            </Link>

                            {item.selectedVariant && (
                              <div className="text-xs text-slate-500 font-medium">
                                Variant:{" "}
                                <strong className="text-slate-700">{item.selectedVariant}</strong>
                              </div>
                            )}

                            {itemValidation && !itemValidation.isValid && (
                              <div
                                role="alert"
                                className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg mt-1"
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                  {itemValidation.errorMessage ||
                                    `Only ${itemValidation.availableQuantity} left in stock.`}
                                </span>
                              </div>
                            )}

                            <div className="text-xs font-semibold text-slate-500 sm:hidden tabular-nums">
                              Unit Price: {formatBDT(item.price)}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Stepper & Line Total */}
                        <div className="flex items-center justify-between w-full sm:w-auto sm:gap-5 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-2xs transition-[background-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              aria-label={`Decrease quantity of ${item.product.title}`}
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span className="w-9 text-center font-black text-xs text-slate-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-2xs transition-[background-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              aria-label={`Increase quantity of ${item.product.title}`}
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="text-right sm:min-w-[112px]">
                            <span className="text-sm sm:text-base font-black text-slate-900 block tabular-nums">
                              {formatBDT(lineTotal)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline tabular-nums">
                              {formatBDT(item.price)} / unit
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={`Remove ${item.product.title} from cart`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Continue Exploring Tech Catalog</span>
                </Link>
              </div>
            </div>

            {/* Right 4 Cols: 3D Sticky Order Summary Sidebar */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
              <div className="surface-3d rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                  <h2 className="text-base font-black text-slate-900">Order Summary</h2>
                  {isCalculating && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Syncing…</span>
                    </span>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Items Subtotal ({totalUnitCount})</span>
                  <span className="font-black text-slate-900 text-sm tabular-nums">
                    {formatBDT(subtotal)}
                  </span>
                </div>

                {/* Interactive Delivery Zone & Shipping Methods Selector */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                      <span>Delivery Zone:</span>
                    </span>
                    <span
                      className={`font-mono font-black text-xs px-2 py-0.5 rounded-md tabular-nums ${shippingFee === 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                    >
                      {shippingFee === 0 ? "FREE" : `+${formatBDT(shippingFee)}`}
                    </span>
                  </div>

                  {/* Delivery Zone Select Box */}
                  {isLoadingShipping ? (
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <div className="relative">
                      <select
                        id="cart-delivery-zone"
                        name="delivery-zone"
                        value={selectedZoneId}
                        onChange={(e) => handleZoneChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 appearance-none cursor-pointer"
                      >
                        {shippingZones.map((zone) => (
                          <option key={zone.id} value={zone.id} className="text-slate-900 font-medium">
                            {zone.name} {zone.description ? `(${zone.description})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* Shipping Methods for selected zone */}
                  {methodsForSelectedZone.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-extrabold text-slate-600 block">
                        Shipping Methods:
                      </span>
                      <div className="space-y-1.5">
                        {methodsForSelectedZone.map((method) => {
                          const isMethodSelected = method.id === selectedMethodId;
                          const effectiveCost = isFreeShippingEligible ? 0 : Number(method.cost);

                          return (
                            <button
                              key={method.id}
                              type="button"
                              aria-pressed={isMethodSelected}
                              onClick={() => handleMethodChange(method.id)}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isMethodSelected
                                  ? "border-blue-600 bg-blue-50/50 text-blue-950 font-bold shadow-2xs"
                                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${isMethodSelected ? "border-blue-600" : "border-slate-300"
                                    }`}
                                >
                                  {isMethodSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-black truncate block">
                                    {method.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium block">
                                    Est. {method.estimatedDays} {method.estimatedDays === 1 ? "Day" : "Days"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-black tabular-nums shrink-0 ml-2 ${effectiveCost === 0 ? "text-emerald-700 font-black" : "text-slate-900"
                                  }`}
                              >
                                {effectiveCost === 0 ? "FREE" : formatBDT(effectiveCost)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Code Box */}
                <div className="pt-3 border-t border-slate-100">
                  <label
                    htmlFor="cart-coupon-code"
                    className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Promo / Coupon Code</span>
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                      <div>
                        <span className="font-black text-emerald-800">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-700 block font-semibold tabular-nums">
                          Instant Savings: {formatBDT(couponDiscount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] font-black text-rose-600 hover:underline px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          id="cart-coupon-code"
                          name="coupon"
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="e.g. AZDEAL…"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        />
                        <button
                          type="submit"
                          disabled={isApplyingCoupon}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                        >
                          {isApplyingCoupon ? "Checking…" : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p
                          role="alert"
                          className="text-[11px] text-rose-600 font-semibold flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{couponError}</span>
                        </p>
                      )}
                    </form>
                  )}
                </div>

                {/* Coupon Discount Row */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Promo Discount</span>
                    <span className="tabular-nums">-{formatBDT(couponDiscount)}</span>
                  </div>
                )}

                {/* 3D Dark Obsidian Total Payable Pod */}
                <div
                  aria-live="polite"
                  className="rounded-2xl surface-3d-dark bg-tech-grid p-4 text-white"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300 block">
                        Total Payable
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {selectedZone?.name || "Standard"} courier &amp; VAT included
                      </span>
                    </div>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                      {formatBDT(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  type="button"
                  disabled={!canProceedToCheckout}
                  onClick={() => router.push("/checkout")}
                  className={`w-full py-3.5 px-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white font-black text-sm rounded-2xl flex items-center justify-between shadow-md transition-[background-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${!canProceedToCheckout
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-blue-800 hover:to-indigo-800 hover:shadow-lg cursor-pointer group"
                    }`}
                >
                  <span>Proceed to Checkout</span>
                  <div className="flex items-center gap-1.5">
                    <span className="tabular-nums font-extrabold text-blue-100">
                      {formatBDT(grandTotal)}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {!canProceedToCheckout && (
                  <p
                    role="alert"
                    className="text-[11px] text-rose-600 font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Please adjust items exceeding available stock before proceeding.</span>
                  </p>
                )}
              </div>

              {/* 3D Tilt Assurance Card */}
              <Tilt3DCard maxTilt={4} scale={1.01}>
                <div className="surface-3d rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                    <span className="font-bold">100% Official Brand Warranty</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span className="font-bold">Cash on Delivery Across 64 Districts</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-orange-600 shrink-0" aria-hidden="true" />
                    <span className="font-bold">7-Day Hassle-Free Replacement</span>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        ) : (
          <Tilt3DCard maxTilt={5} scale={1.01} className="max-w-lg mx-auto">
            <div className="surface-3d rounded-3xl p-10 sm:p-14 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-inner">
                <ShoppingBag className="w-10 h-10" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">
                Your basket is empty
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                Explore flagship smartphones, laptops, and audio gear backed by official manufacturer warranty.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Explore Tech Catalog</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Tilt3DCard>
        )}
      </div>
    </StorefrontShell>
  );
}
