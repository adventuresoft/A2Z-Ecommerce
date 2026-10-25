"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  PackageCheck,
  ArrowLeft,
  Loader2,
  Plus,
  MapPin,
  Tag,
  AlertCircle,
  Check,
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { formatBDT } from "../../data/mock-catalog";
import { apiClient, ApiError } from "../../lib/api-client";

const BANGLADESH_DIVISIONS = [
  "Dhaka",
  "Chittagong",
  "Rajshahi",
  "Sylhet",
  "Khulna",
  "Barisal",
  "Rangpur",
  "Mymensingh",
];

const DISTRICT_SUGGESTIONS: Record<string, string[]> = {
  Dhaka: ["Dhaka City (North)", "Dhaka City (South)", "Gazipur", "Narayanganj", "Tangail", "Narsingdi"],
  Chittagong: ["Chittagong City", "Cox's Bazar", "Comilla", "Feni", "Brahmanbaria", "Noakhali"],
  Rajshahi: ["Rajshahi City", "Bogra", "Pabna", "Naogaon", "Sirajganj"],
  Sylhet: ["Sylhet City", "Moulvibazar", "Habiganj", "Sunamganj"],
  Khulna: ["Khulna City", "Jessore", "Kushtia", "Satkhira"],
  Barisal: ["Barisal City", "Patuakhali", "Bhola"],
  Rangpur: ["Rangpur City", "Dinajpur", "Kurigram"],
  Mymensingh: ["Mymensingh City", "Jamalpur", "Netrokona"],
};

interface UserAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface ShippingMethodItem {
  id: string;
  zoneId: string;
  name: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
}

interface CalculationState {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalTaxAmount: number;
  grandTotal: number;
  shippingMethod?: {
    id: string;
    name: string;
    estimatedDays: number;
    cost: number;
  } | null;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    description?: string | null;
  } | null;
  itemsValidation: Array<{
    variantId: string;
    productTitle?: string;
    isValid: boolean;
    availableQuantity: number;
    errorMessage?: string;
  }>;
  isEligibleForCheckout: boolean;
}

interface PlacedOrderItem {
  id: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PlacedOrderResult {
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
  items: PlacedOrderItem[];
  createdAt: string;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "idemp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, totalCartPrice, clearCart } = useStore();

  // Session idempotency key
  const [idempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // Saved Addresses State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Address Form Fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("Dhaka");
  const [selectedDistrict, setSelectedDistrict] = useState("Dhaka City (North)");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("1212");
  const [orderNotes, setOrderNotes] = useState("");
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);

  // Available Shipping Methods from backend
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodItem[]>([]);
  const [selectedSpeed, setSelectedSpeed] = useState<"standard" | "express">("standard");

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "MOBILE_BANKING" | "CARD">(
    "CASH_ON_DELIVERY"
  );
  const [mfsSenderPhone, setMfsSenderPhone] = useState("");
  const [mfsTrxId, setMfsTrxId] = useState("");

  // Coupon handling in Checkout
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Authoritative Calculation from backend
  const [calculation, setCalculation] = useState<CalculationState | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderResult | null>(null);

  // 1. Enforce Authentication Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // 2. Fetch Customer Addresses and Shipping Methods on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    setLoadingAddresses(true);

    Promise.allSettled([
      apiClient.get<UserAddress[]>("/account/addresses"),
      apiClient.get<ShippingMethodItem[]>("/shipping/methods"),
    ]).then(([addrRes, methodsRes]) => {
      if (!isMounted) return;

      if (addrRes.status === "fulfilled" && Array.isArray(addrRes.value) && addrRes.value.length > 0) {
        setAddresses(addrRes.value);
        const defaultShipping =
          addrRes.value.find((a) => a.isDefaultShipping) || addrRes.value[0];
        if (defaultShipping) {
          setSelectedAddressId(defaultShipping.id);
          setFullName(defaultShipping.recipientName);
          setPhoneNumber(defaultShipping.phone.replace(/^\+880/, ""));
          setStreetAddress(defaultShipping.streetAddress);
          setSelectedDistrict(defaultShipping.city || "Dhaka City (North)");
          if (defaultShipping.state && BANGLADESH_DIVISIONS.includes(defaultShipping.state)) {
            setSelectedDivision(defaultShipping.state);
          }
          setPostalCode(defaultShipping.postalCode || "1212");
        }
      } else if (user) {
        setFullName(user.name || "");
        if (user.phone) {
          setPhoneNumber(user.phone.replace(/^\+880/, ""));
        }
      }

      if (methodsRes.status === "fulfilled" && Array.isArray(methodsRes.value)) {
        setShippingMethods(methodsRes.value);
      }

      setLoadingAddresses(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Handle switching between saved address cards
  const handleSelectAddressCard = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.recipientName);
    setPhoneNumber(addr.phone.replace(/^\+880/, ""));
    setStreetAddress(addr.streetAddress);
    setSelectedDistrict(addr.city);
    if (addr.state && BANGLADESH_DIVISIONS.includes(addr.state)) {
      setSelectedDivision(addr.state);
    }
    setPostalCode(addr.postalCode || "1212");
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId("new");
    if (user) {
      setFullName(user.name || "");
      if (user.phone) setPhoneNumber(user.phone.replace(/^\+880/, ""));
    } else {
      setFullName("");
      setPhoneNumber("");
    }
    setStreetAddress("");
    setSelectedDivision("Dhaka");
    setSelectedDistrict("Dhaka City (North)");
    setPostalCode("1212");
  };

  // 3. Resolve active shipping method matching zone and speed
  const isDhaka =
    selectedDivision.toLowerCase().includes("dhaka") ||
    selectedDistrict.toLowerCase().includes("dhaka");

  const matchingShippingMethod = shippingMethods.find((m) => {
    const name = m.name.toLowerCase();
    if (selectedSpeed === "express") {
      return name.includes("express") && (isDhaka ? name.includes("inside") || name.includes("dhaka") : name.includes("outside"));
    }
    return isDhaka ? name.includes("inside") || name.includes("dhaka") : name.includes("outside");
  });

  // 4. Server-Authoritative Pre-Checkout Calculation
  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    let isMounted = true;
    setIsCalculating(true);

    const calculateCheckout = async () => {
      try {
        const payload = {
          items: cart.map((item) => ({
            variantId: item.variantId || item.id,
            quantity: item.quantity,
          })),
          shippingCity: selectedDistrict || (isDhaka ? "Dhaka" : "Outside Dhaka"),
          shippingMethodId: matchingShippingMethod?.id || undefined,
          couponCode: appliedCoupon?.code || undefined,
        };

        const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
        if (isMounted) {
          setCalculation(res);
          if (res.coupon && appliedCoupon) {
            setAppliedCoupon({ code: res.coupon.code, discount: res.discountAmount });
          }
        }
      } catch (err: any) {
        if (appliedCoupon && err?.status === 400 && isMounted) {
          setAppliedCoupon(null);
          setCouponError(err.message || "Applied coupon is no longer eligible.");
        }
      } finally {
        if (isMounted) {
          setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(calculateCheckout, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    cart,
    selectedDivision,
    selectedDistrict,
    selectedSpeed,
    appliedCoupon?.code,
    matchingShippingMethod?.id,
    isDhaka,
  ]);

  // Fallback financial totals
  const subtotal = calculation ? calculation.subtotal : totalCartPrice;
  const shippingFee = calculation
    ? calculation.shippingFee
    : totalCartPrice >= 100000
    ? 0
    : selectedSpeed === "express"
    ? isDhaka
      ? 150
      : 210
    : isDhaka
    ? 60
    : 120;
  const discountAmount = calculation ? calculation.discountAmount : (appliedCoupon?.discount || 0);
  const grandTotal = calculation
    ? calculation.grandTotal
    : Math.max(0, subtotal + shippingFee - discountAmount);

  // Coupon handling
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCodeInput.trim().toUpperCase();
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
        shippingCity: selectedDistrict || (isDhaka ? "Dhaka" : "Outside Dhaka"),
        shippingMethodId: matchingShippingMethod?.id || undefined,
        couponCode: code,
      };

      const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
      setCalculation(res);
      setAppliedCoupon({ code, discount: res.discountAmount });
      setCouponCodeInput("");
      setCouponError("");
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Invalid coupon code.";
      setCouponError(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // 5. Final Order Submission Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim() || !phoneNumber.trim() || !streetAddress.trim()) {
      setSubmitError("Please fill in recipient name, phone number, and street address.");
      return;
    }

    if (paymentMethod === "CARD") {
      setSubmitError("Online card payments are coming soon. Please select Cash on Delivery or bKash.");
      return;
    }

    if (paymentMethod === "MOBILE_BANKING") {
      if (!mfsSenderPhone.trim() || !mfsTrxId.trim()) {
        setSubmitError("Please enter your bKash/Nagad sender phone number and Transaction ID (TrxID).");
        return;
      }
    }

    if (calculation && !calculation.isEligibleForCheckout) {
      setSubmitError("Some items in your cart exceed available stock. Please adjust quantities.");
      return;
    }

    setIsSubmitting(true);

    try {
      // If user opted to save this address to address book
      if (saveAddressToBook && selectedAddressId === "new") {
        try {
          const rawPhone = phoneNumber.trim();
          const formattedPhone = rawPhone.startsWith("+880")
            ? rawPhone
            : `+880${rawPhone.replace(/^0+/, "")}`;
          await apiClient.post("/account/addresses", {
            recipientName: fullName.trim(),
            phone: formattedPhone,
            streetAddress: streetAddress.trim(),
            city: selectedDistrict,
            state: selectedDivision,
            postalCode: postalCode.trim() || "1212",
            label: "Home",
          });
        } catch {
          // Address book saving failure is non-blocking for order placement
        }
      }

      const rawPhone = phoneNumber.trim();
      const formattedPhone = rawPhone.startsWith("+880")
        ? rawPhone
        : `+880${rawPhone.replace(/^0+/, "")}`;

      const orderPayload = {
        recipientName: fullName.trim(),
        recipientPhone: formattedPhone,
        shippingStreet: streetAddress.trim(),
        shippingCity: selectedDistrict,
        shippingState: selectedDivision,
        shippingPostalCode: postalCode.trim() || "1212",
        customerNotes: orderNotes.trim() || undefined,
        shippingMethodId: matchingShippingMethod?.id || undefined,
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod: paymentMethod === "MOBILE_BANKING" ? "MOBILE_BANKING" : "CASH_ON_DELIVERY",
        paymentReference:
          paymentMethod === "MOBILE_BANKING"
            ? `bKash/Nagad TrxID: ${mfsTrxId.trim()} (Sender: ${mfsSenderPhone.trim()})`
            : undefined,
        items: cart.map((item) => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity,
        })),
      };

      const res = await apiClient.post<PlacedOrderResult>("/orders", orderPayload, {
        headers: {
          "idempotency-key": idempotencyKey,
        },
      });

      setPlacedOrder(res);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.message || "Failed to place your order. Please review your details and try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering: Auth Loading Screen
  if (authLoading) {
    return (
      <StorefrontShell>
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Checking your customer session...</p>
        </div>
      </StorefrontShell>
    );
  }

  // Rendering: Order Confirmed Screen
  if (placedOrder) {
    return (
      <StorefrontShell hideFooter={false}>
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-sm animate-bounce duration-1000">
              <PackageCheck className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Order Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                Thank You for Your Order!
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
                We have received your order and our fulfillment team in Dhaka is preparing your shipment.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-left space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Order Number</span>
                <span className="font-mono font-black text-sm text-blue-700">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Total Payable</span>
                <span className="font-black text-sm text-slate-900">
                  {formatBDT(placedOrder.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Method</span>
                <span className="font-bold text-slate-800">
                  {placedOrder.paymentMethod === "MOBILE_BANKING"
                    ? "bKash / Nagad Mobile Banking (Pending Verification)"
                    : "Cash on Delivery (COD)"}
                </span>
              </div>
              {placedOrder.paymentReference && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Payment Reference</span>
                  <span className="font-mono font-bold text-slate-800">
                    {placedOrder.paymentReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Estimated Delivery</span>
                <span className="font-bold text-emerald-700 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {selectedSpeed === "express"
                    ? "Within 24 Hours (Express Priority)"
                    : isDhaka
                    ? "24–48 Hours (Dhaka Metro)"
                    : "3–5 Working Days (Nationwide)"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Shipping Address</span>
                <span className="font-bold text-slate-800 leading-relaxed">
                  {placedOrder.recipientName} ({placedOrder.recipientPhone})
                  <br />
                  {placedOrder.shippingStreet}, {placedOrder.shippingCity}, {placedOrder.shippingState} -{" "}
                  {placedOrder.shippingPostalCode}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/account"
                className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>View Orders in Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </StorefrontShell>
    );
  }

  // Rendering: Empty Cart Guard
  if (cart.length === 0) {
    return (
      <StorefrontShell>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No Items in Checkout</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            Please add at least one product to your cart before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Shop Catalog</span>
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Header */}
        <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-700">
            Home
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-blue-700">
            Cart
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Secure Checkout</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Express Checkout
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <strong className="text-slate-800">{user?.email}</strong>. Complete your delivery & payment.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Delivery Information & Payment Method */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Contact & Delivery Address */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h2 className="text-base font-black text-slate-900">
                      Contact & Delivery Address
                    </h2>
                  </div>
                  {addresses.length > 0 && selectedAddressId !== "new" && (
                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use New Address</span>
                    </button>
                  )}
                </div>

                {/* Saved Address Cards */}
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 block">
                      Choose from your saved addresses:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddressCard(addr)}
                            className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all relative ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/40 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-xs text-slate-900 flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1" />
                                {addr.label || "Saved Address"}
                              </span>
                              {addr.isDefaultShipping && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-slate-800">
                              {addr.recipientName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {addr.phone}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                              {addr.streetAddress}, {addr.city}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <div className="pt-2">
                  {addresses.length > 0 && (
                    <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                      <span>
                        {selectedAddressId === "new"
                          ? "Enter delivery location details:"
                          : "Delivery details for selected address:"}
                      </span>
                      {selectedAddressId !== "new" && (
                        <span className="text-[11px] text-slate-500 font-normal">
                          (Editable for this order)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Full Name */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        Recipient Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tariqul Islam"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        Mobile Number (+880) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400">
                          +880
                        </span>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="1712345678"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Division */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        Division <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedDivision}
                        onChange={(e) => {
                          const div = e.target.value;
                          setSelectedDivision(div);
                          if (DISTRICT_SUGGESTIONS[div]?.[0]) {
                            setSelectedDistrict(DISTRICT_SUGGESTIONS[div][0]);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {BANGLADESH_DIVISIONS.map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District / City */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        City / District <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {(DISTRICT_SUGGESTIONS[selectedDivision] || ["District Center"]).map(
                          (dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* Street Address */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 block">
                        Street Address, House & Road <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g. House 42, Road 11, Sector 4, Banani, Dhaka"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                      />
                    </div>

                    {/* Postal Code & Order Notes */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        Postal / ZIP Code
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="1212"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="font-bold text-slate-700 block">
                        Delivery Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="e.g. Call before delivery"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* Save to address book toggle if new */}
                    {selectedAddressId === "new" && (
                      <div className="sm:col-span-2 pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={saveAddressToBook}
                            onChange={(e) => setSaveAddressToBook(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Save this delivery address to my address book</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Speed & Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    Delivery Speed & Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Standard */}
                  <label
                    onClick={() => setSelectedSpeed("standard")}
                    className={`p-4 rounded-2xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                      selectedSpeed === "standard"
                        ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900">
                        Standard Courier Delivery
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {isDhaka ? "24–48 Hours within Dhaka" : "3–5 Days nationwide"}
                      </div>
                    </div>
                    <span className="font-black text-blue-700">
                      {subtotal >= 100000 ? "FREE" : isDhaka ? "৳60" : "৳120"}
                    </span>
                  </label>

                  {/* Express */}
                  <label
                    onClick={() => setSelectedSpeed("express")}
                    className={`p-4 rounded-2xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                      selectedSpeed === "express"
                        ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 flex items-center space-x-1">
                        <span>Express Priority Delivery</span>
                        <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          FAST
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Same-day / Next-day priority courier
                      </div>
                    </div>
                    <span className="font-black text-blue-700">
                      {isDhaka ? "৳150" : "৳210"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* COD */}
                  <label
                    onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === "CASH_ON_DELIVERY"
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {paymentMethod === "CASH_ON_DELIVERY" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span className="font-black text-sm text-slate-900">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Pay cash directly to our delivery courier after receiving and inspecting the package at your doorstep.
                      </p>
                    </div>
                  </label>

                  {/* bKash / Nagad Mobile Banking */}
                  <div
                    onClick={() => setPaymentMethod("MOBILE_BANKING")}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "MOBILE_BANKING"
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        {paymentMethod === "MOBILE_BANKING" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-4 h-4 text-pink-600" />
                          <span className="font-black text-sm text-slate-900">
                            bKash / Nagad Mobile Banking
                          </span>
                          <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                            Zero Fee
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Pay instantly via official bKash / Nagad merchant wallet.
                        </p>
                      </div>
                    </div>

                    {/* MFS Input Panel */}
                    {paymentMethod === "MOBILE_BANKING" && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 pt-4 border-t border-slate-200/80 space-y-3"
                      >
                        <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900">
                          <p className="font-bold">Payment Instructions:</p>
                          <p className="mt-0.5">
                            Please make payment of <strong>{formatBDT(grandTotal)}</strong> to Merchant Account:{" "}
                            <span className="font-mono font-black text-pink-800">01700-000000</span> (bKash/Nagad).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              Sender Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={mfsSenderPhone}
                              onChange={(e) => setMfsSenderPhone(e.target.value)}
                              placeholder="01712345678"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">
                              Transaction ID (TrxID) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={mfsTrxId}
                              onChange={(e) => setMfsTrxId(e.target.value.toUpperCase())}
                              placeholder="e.g. 9X7B2144A9"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card (Coming Soon) */}
                  <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/60 opacity-60 flex items-start space-x-3 cursor-not-allowed">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="font-black text-sm text-slate-500">
                          Credit / Debit Card (Visa, MasterCard, Amex)
                        </span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Online payment gateway integration in progress. Please choose COD or bKash.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary & Placement */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-200">
                  Review Your Order ({cart.reduce((a, b) => a + b.quantity, 0)} items)
                </h3>

                {/* Items Thumbnails list */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-2.5 first:pt-0 flex items-center space-x-3">
                      <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          fill
                          className="object-contain p-0.5"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-medium flex justify-between">
                          <span>Qty: {item.quantity}</span>
                          <span className="font-bold text-slate-800">
                            {formatBDT(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Coupon Promotion</span>
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <div>
                        <span className="font-black text-emerald-700">{appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-600 block">
                          Savings: {formatBDT(appliedCoupon.discount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-black text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="e.g. AZDEAL"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          {isApplyingCoupon ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-semibold flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatBDT(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee ({selectedDivision})</span>
                    <span className="font-bold text-slate-900">
                      {shippingFee === 0 ? "FREE" : formatBDT(shippingFee)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount</span>
                      <span>-{formatBDT(discountAmount)}</span>
                    </div>
                  )}

                  {calculation?.totalTaxAmount ? (
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Statutory VAT (Inclusive)</span>
                      <span>{formatBDT(calculation.totalTaxAmount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-baseline text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                    <div>
                      <span>Total Payable</span>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        VAT & Courier Included
                      </span>
                    </div>
                    <span className="text-xl font-black text-blue-700">
                      {formatBDT(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Stock Warning if ineligible */}
                {calculation && !calculation.isEligibleForCheckout && (
                  <p className="text-[11px] text-rose-600 font-semibold text-center mt-2 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    Some items exceed current warehouse stock. Please return to cart.
                  </p>
                )}

                {/* Confirm Order CTA */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isCalculating ||
                    (calculation !== null && !calculation.isEligibleForCheckout)
                  }
                  className="w-full py-4 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-60 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Order...</span>
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Confirm Order • {formatBDT(grandTotal)}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed">
                  By clicking Confirm Order, you agree to our genuine warranty guarantee and official return policy.
                </p>
              </div>

              {/* Trust Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Official Authorized Warranty</span>
                </div>
                <div className="flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inspect package before COD payment</span>
                </div>
                <div className="flex items-center space-x-2 font-semibold">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Fast Delivery Across 64 Districts</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StorefrontShell>
  );
}
