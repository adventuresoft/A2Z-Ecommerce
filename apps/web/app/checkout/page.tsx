"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Banknote,
  Smartphone,
  ArrowLeft,
  Loader2,
  Plus,
  MapPin,
  Tag,
  AlertCircle,
  Zap,
  Check,
  Landmark,
  FileCheck2,
  CreditCard,
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { CheckoutStepHeader } from "../../components/Checkout/CheckoutStepHeader";
import {
  OrderThankYouView,
  ThankYouOrderData,
} from "../../components/Checkout/OrderThankYouView";
import { Tilt3DCard } from "../../components/UI/Tilt3DCard";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { formatBDT } from "../../data/mock-catalog";
import { apiClient, ApiError } from "../../lib/api-client";

const FREE_SHIPPING_THRESHOLD = 100000;

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
  Dhaka: [
    "Dhaka City (North)",
    "Dhaka City (South)",
    "Gazipur",
    "Narayanganj",
    "Tangail",
    "Narsingdi",
  ],
  Chittagong: [
    "Chittagong City",
    "Cox's Bazar",
    "Comilla",
    "Feni",
    "Brahmanbaria",
    "Noakhali",
  ],
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
  name: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
  sortOrder?: number;
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

interface SyncedCheckoutCalculation extends CalculationState {
  syncKey: string;
}

export interface ActivePaymentMethod {
  code: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  sortOrder?: number;
}

const FALLBACK_PAYMENT_METHODS: ActivePaymentMethod[] = [
  {
    code: "PAYSTATION",
    name: "PayStation Online Gateway",
    description:
      "Pay securely via Visa, Mastercard, bKash, Nagad, Rocket, or Internet Banking with 256-bit bank-grade encryption.",
    instructions:
      "You will be redirected to PayStation's official SSL portal to complete payment with automated verification.",
    sortOrder: 1,
  },
  {
    code: "CASH_ON_DELIVERY",
    name: "Cash on Delivery (COD)",
    description:
      "Pay cash directly to our courier rider after inspecting the factory-sealed parcel at your doorstep.",
    instructions:
      "Please have the exact cash ready when the delivery rider arrives at your doorstep.",
    sortOrder: 2,
  },
  {
    code: "MOBILE_BANKING",
    name: "Manual Mobile Banking (bKash / Nagad)",
    description:
      "Send money directly to our merchant wallet and submit your Transaction ID (TrxID) below.",
    instructions:
      "Please send payment to Merchant bKash/Nagad Number: 01700000000 (Counter: 1). Enter your Order Number in the reference field.",
    sortOrder: 3,
  },
];

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

  const [idempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // Saved Addresses State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
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

  // Available Shipping Zones and Methods from backend
  const [shippingZones, setShippingZones] = useState<ShippingZoneItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [isLoadingShipping, setIsLoadingShipping] = useState<boolean>(true);

  // Payment Selection (Dynamic from backend)
  const [paymentMethods, setPaymentMethods] = useState<ActivePaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("PAYSTATION");
  const [mfsSenderPhone, setMfsSenderPhone] = useState("");
  const [mfsTrxId, setMfsTrxId] = useState("");
  const [bankTransferRef, setBankTransferRef] = useState("");

  // Coupon handling in Checkout
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Authoritative Calculation from backend
  const [calculation, setCalculation] = useState<SyncedCheckoutCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<ThankYouOrderData | null>(null);

  // 1. Enforce Authentication Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // 2. Fetch Customer Addresses, Shipping Zones & Methods on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    Promise.allSettled([
      apiClient.get<UserAddress[]>("/account/addresses"),
      apiClient.get<ShippingZoneItem[]>("/shipping/zones"),
      apiClient.get<ShippingMethodItem[]>("/shipping/methods"),
    ]).then(([addrRes, zonesRes, methodsRes]) => {
      if (!isMounted) return;

      if (
        addrRes.status === "fulfilled" &&
        Array.isArray(addrRes.value) &&
        addrRes.value.length > 0
      ) {
        setAddresses(addrRes.value);
        const defaultShipping =
          addrRes.value.find((a) => a.isDefaultShipping) || addrRes.value[0];
        if (defaultShipping) {
          setSelectedAddressId(defaultShipping.id);
          setFullName(defaultShipping.recipientName);
          setPhoneNumber(defaultShipping.phone.replace(/^\+880/, ""));
          setStreetAddress(defaultShipping.streetAddress);
          setSelectedDistrict(defaultShipping.city || "Dhaka City (North)");
          if (
            defaultShipping.state &&
            BANGLADESH_DIVISIONS.includes(defaultShipping.state)
          ) {
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

      const loadedZones =
        zonesRes.status === "fulfilled" && Array.isArray(zonesRes.value) && zonesRes.value.length > 0
          ? zonesRes.value.sort((a, b) => a.sortOrder - b.sortOrder)
          : FALLBACK_SHIPPING_ZONES;

      const loadedMethods =
        methodsRes.status === "fulfilled" && Array.isArray(methodsRes.value) && methodsRes.value.length > 0
          ? methodsRes.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          : FALLBACK_SHIPPING_METHODS;

      setShippingZones(loadedZones);
      setShippingMethods(loadedMethods);

      // Hydrate from localStorage if set from Cart
      const savedZoneId = window.localStorage.getItem("az_shipping_zone_id");
      const savedMethodId = window.localStorage.getItem("az_shipping_method_id");

      let initialZone = loadedZones.find((z) => z.id === savedZoneId);
      if (!initialZone) {
        initialZone = loadedZones[0];
      }
      const initialZoneId = initialZone ? initialZone.id : "";
      setSelectedZoneId(initialZoneId);

      const zoneMethods = loadedMethods.filter((m) => m.zoneId === initialZoneId);
      const initialMethod = zoneMethods.find((m) => m.id === savedMethodId) || zoneMethods[0];
      setSelectedMethodId(initialMethod ? initialMethod.id : "");
      setIsLoadingShipping(false);
    });

    try {
      const savedCoupon = window.sessionStorage.getItem("az_applied_coupon");
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon) as { code: string; discount: number };
        if (parsed?.code) {
          setAppliedCoupon(parsed);
        }
      }
    } catch {
      // Ignore
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    try {
      window.localStorage.setItem("az_shipping_zone_id", zoneId);
    } catch {
      // Ignore
    }
    const zoneMethods = shippingMethods.filter((m) => m.zoneId === zoneId);
    const firstMethod = zoneMethods[0];
    if (firstMethod) {
      setSelectedMethodId(firstMethod.id);
      try {
        window.localStorage.setItem("az_shipping_method_id", firstMethod.id);
      } catch {
        // Ignore
      }
    }
  };

  const handleMethodChange = (methodId: string) => {
    setSelectedMethodId(methodId);
    try {
      window.localStorage.setItem("az_shipping_method_id", methodId);
    } catch {
      // Ignore
    }
  };

  // Fetch active payment methods from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchActivePaymentMethods() {
      try {
        setIsLoadingPaymentMethods(true);
        const data = await apiClient.get<ActivePaymentMethod[]>("/payments/methods/active");
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            const sorted = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            setPaymentMethods(sorted);
            setPaymentMethod((prev) => {
              const exists = sorted.some((m) => m.code === prev);
              const firstCode = sorted[0]?.code;
              return exists ? prev : firstCode || "PAYSTATION";
            });
          } else {
            setPaymentMethods(FALLBACK_PAYMENT_METHODS);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch active payment methods, using fallback list:", err);
        if (isMounted) {
          setPaymentMethods(FALLBACK_PAYMENT_METHODS);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPaymentMethods(false);
        }
      }
    }

    fetchActivePaymentMethods();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // 3. Resolve active shipping method matching selected zone
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId);
  const isDhaka = selectedZone
    ? selectedZone.name.toLowerCase().includes("dhaka") &&
    !selectedZone.name.toLowerCase().includes("outside")
    : selectedDivision.toLowerCase().includes("dhaka");

  const methodsForSelectedZone = shippingMethods.filter((m) => m.zoneId === selectedZoneId);
  const matchingShippingMethod =
    methodsForSelectedZone.find((m) => m.id === selectedMethodId) || methodsForSelectedZone[0];

  const currentSyncKey = `${selectedZoneId}:${matchingShippingMethod?.id || "fallback"}`;

  // 4. Server-Authoritative Pre-Checkout Calculation
  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    let isMounted = true;
    const requestedSyncKey = currentSyncKey;
    setIsCalculating(true);

    const calculateCheckout = async () => {
      try {
        const payload = {
          items: cart.map((item) => ({
            variantId: item.variantId || item.id,
            quantity: item.quantity,
          })),
          shippingCity: selectedDistrict || (isDhaka ? "Dhaka" : "Chittagong"),
          shippingMethodId: matchingShippingMethod?.id || undefined,
          couponCode: appliedCoupon?.code || undefined,
        };

        const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
        if (isMounted) {
          setCalculation({ ...res, syncKey: requestedSyncKey });
          if (res.coupon && appliedCoupon) {
            setAppliedCoupon({ code: res.coupon.code, discount: res.discountAmount });
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

    const timer = setTimeout(calculateCheckout, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    cart,
    selectedDivision,
    selectedDistrict,
    selectedZoneId,
    matchingShippingMethod?.id,
    appliedCoupon?.code,
    isDhaka,
    currentSyncKey,
  ]);

  // Deterministic financial totals with 0ms reactivity on zone/method switches
  const isCalcSynced = calculation !== null && calculation.syncKey === currentSyncKey;
  const subtotal = calculation ? calculation.subtotal : totalCartPrice;
  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const baseCost = matchingShippingMethod ? Number(matchingShippingMethod.cost) : isDhaka ? 60 : 120;
  const deterministicShippingFee = isFreeShippingEligible ? 0 : baseCost;
  const shippingFee = isCalcSynced ? calculation.shippingFee : deterministicShippingFee;
  const discountAmount = calculation ? calculation.discountAmount : appliedCoupon?.discount || 0;
  const grandTotal = isCalcSynced
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
        shippingCity: selectedDistrict || (isDhaka ? "Dhaka" : "Chittagong"),
        shippingMethodId: matchingShippingMethod?.id || undefined,
        couponCode: code,
      };

      const res = await apiClient.post<CalculationState>("/checkout/calculate", payload);
      setCalculation({ ...res, syncKey: currentSyncKey });
      const nextCoupon = { code, discount: res.discountAmount };
      setAppliedCoupon(nextCoupon);
      try {
        window.sessionStorage.setItem("az_applied_coupon", JSON.stringify(nextCoupon));
      } catch {
        // Ignore
      }
      setCouponCodeInput("");
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

  const persistCompletedOrder = (order: ThankYouOrderData) => {
    try {
      window.sessionStorage.setItem("az_last_order", JSON.stringify(order));
      window.sessionStorage.removeItem("az_applied_coupon");
    } catch {
      // Ignore
    }
  };

  // 5. Final Order Submission Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim() || !phoneNumber.trim() || !streetAddress.trim()) {
      setSubmitError("Please fill in recipient name, phone number, and street address.");
      return;
    }

    if (paymentMethod === "MOBILE_BANKING") {
      if (!mfsSenderPhone.trim() || !mfsTrxId.trim()) {
        setSubmitError(
          "Please enter your bKash/Nagad sender phone number and Transaction ID (TrxID)."
        );
        return;
      }
    }

    if (calculation && !calculation.isEligibleForCheckout) {
      setSubmitError(
        "Some items in your cart exceed available stock. Please adjust quantities."
      );
      return;
    }

    setIsSubmitting(true);

    try {
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
          // Non-blocking
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
        paymentMethod,
        paymentReference:
          paymentMethod === "MOBILE_BANKING"
            ? `bKash/Nagad TrxID: ${mfsTrxId.trim()} (Sender: ${mfsSenderPhone.trim()})`
            : paymentMethod === "BANK_TRANSFER" || paymentMethod === "CHECK_PAYMENT"
              ? bankTransferRef.trim() || undefined
              : undefined,
        items: cart.map((item) => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity,
        })),
      };

      const res = await apiClient.post<ThankYouOrderData>("/orders", orderPayload, {
        headers: {
          "idempotency-key": idempotencyKey,
        },
      });

      const enrichedOrder: ThankYouOrderData = {
        ...res,
        estimatedDeliveryLabel: matchingShippingMethod
          ? `${matchingShippingMethod.name} (${matchingShippingMethod.estimatedDays} ${matchingShippingMethod.estimatedDays === 1 ? "Working Day" : "Working Days"})`
          : isDhaka
            ? "24–48 Hours (Dhaka Metro)"
            : "3–5 Working Days (Nationwide)",
      };

      persistCompletedOrder(enrichedOrder);

      if (paymentMethod === "PAYSTATION") {
        try {
          const callbackUrl = `${window.location.origin}/checkout/payment-callback`;
          const initRes = await apiClient.post<{
            status: string;
            payment_url: string;
            invoice_number: string;
          }>("/payments/paystation/initiate", {
            orderId: res.id,
            callbackUrl,
          });

          clearCart();
          if (initRes.payment_url) {
            window.location.href = initRes.payment_url;
            return;
          }
        } catch (initErr: unknown) {
          setPlacedOrder(enrichedOrder);
          clearCart();
          const initMsg =
            initErr instanceof ApiError
              ? initErr.message
              : initErr instanceof Error
                ? initErr.message
                : "Could not reach PayStation gateway.";
          setSubmitError(
            `Your order ${res.orderNumber} was saved, but redirect to PayStation failed (${initMsg}). You can complete payment from your account dashboard.`
          );
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      setPlacedOrder(enrichedOrder);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to place your order. Please review your details and try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <StorefrontShell>
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-500">
            Checking your customer session…
          </p>
        </div>
      </StorefrontShell>
    );
  }

  // Order Confirmed / Thank You Screen
  if (placedOrder) {
    return (
      <StorefrontShell hideFooter={false}>
        <OrderThankYouView order={placedOrder} warningMessage={submitError} />
      </StorefrontShell>
    );
  }

  // Empty Cart Guard
  if (cart.length === 0) {
    return (
      <StorefrontShell>
        <div className="max-w-xl mx-auto px-4 py-20">
          <Tilt3DCard maxTilt={5} scale={1.01}>
            <div className="surface-3d rounded-3xl p-10 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
                <ShoppingBag className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                No Items in Checkout
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">
                Please add at least one product to your cart before proceeding to checkout.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xl shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Go to Shop Catalog</span>
              </Link>
            </div>
          </Tilt3DCard>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Header */}
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
          <Link
            href="/cart"
            className="hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Cart
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-bold" aria-current="page">
            Secure Checkout
          </span>
        </nav>

        {/* 3-Step Spatial Checkout Progress */}
        <CheckoutStepHeader currentStep={2} />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7 pb-4 border-b border-slate-200/90">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Express Secure Checkout
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Signed in as <strong className="text-slate-800">{user?.email}</strong>. Verify delivery destination &amp; settlement method.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-full self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>256-Bit SSL Protected</span>
          </div>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Delivery Information & Payment Method */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Contact & Delivery Address */}
              <div className="surface-3d rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums"
                      aria-hidden="true"
                    >
                      01
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        Contact &amp; Delivery Destination
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Where our verified courier will deliver your order
                      </p>
                    </div>
                  </div>
                  {addresses.length > 0 && selectedAddressId !== "new" && (
                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>New Address</span>
                    </button>
                  )}
                </div>

                {/* Saved Address Cards */}
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-600 block">
                      Saved address book:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleSelectAddressCard(addr)}
                            className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-[border-color,background-color,box-shadow] relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                                <MapPin
                                  className="w-3.5 h-3.5 text-blue-600"
                                  aria-hidden="true"
                                />
                                <span>{addr.label || "Saved Address"}</span>
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
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5 tabular-nums">
                              {addr.phone}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                              {addr.streetAddress}, {addr.city}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <div className="pt-1">
                  {addresses.length > 0 && (
                    <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                      <span>
                        {selectedAddressId === "new"
                          ? "Enter new delivery details:"
                          : "Confirm details for this shipment:"}
                      </span>
                      {selectedAddressId !== "new" && (
                        <span className="text-[11px] text-slate-500 font-normal">
                          Editable for this order
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-full-name"
                        className="font-bold text-slate-700 block"
                      >
                        Recipient Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-full-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tariqul Islam"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-phone"
                        className="font-bold text-slate-700 block"
                      >
                        Mobile Number (+880) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span
                          className="absolute left-3.5 top-2.5 font-bold text-slate-400"
                          aria-hidden="true"
                        >
                          +880
                        </span>
                        <input
                          id="checkout-phone"
                          name="tel"
                          type="tel"
                          required
                          autoComplete="tel"
                          inputMode="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="1712345678"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-3.5 py-2.5 font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-division"
                        className="font-bold text-slate-700 block"
                      >
                        Division <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="checkout-division"
                        name="division"
                        value={selectedDivision}
                        onChange={(e) => {
                          const div = e.target.value;
                          setSelectedDivision(div);
                          if (DISTRICT_SUGGESTIONS[div]?.[0]) {
                            setSelectedDistrict(DISTRICT_SUGGESTIONS[div][0]);
                          }
                          try {
                            window.localStorage.setItem(
                              "az_shipping_zone",
                              div.toLowerCase().includes("dhaka") ? "inside" : "outside"
                            );
                          } catch {
                            // Ignore
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:border-blue-600 focus:bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        {BANGLADESH_DIVISIONS.map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-district"
                        className="font-bold text-slate-700 block"
                      >
                        City / District <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="checkout-district"
                        name="district"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:border-blue-600 focus:bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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

                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="checkout-street-address"
                        className="font-bold text-slate-700 block"
                      >
                        Street Address, House &amp; Road <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="checkout-street-address"
                        name="street-address"
                        required
                        rows={2}
                        autoComplete="street-address"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g. House 42, Road 11, Sector 4, Banani, Dhaka"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:border-blue-600 focus:bg-white resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-postal-code"
                        className="font-bold text-slate-700 block"
                      >
                        Postal / ZIP Code
                      </label>
                      <input
                        id="checkout-postal-code"
                        name="postal-code"
                        type="text"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="1212"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 tabular-nums"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-order-notes"
                        className="font-bold text-slate-700 block"
                      >
                        Courier Instructions (Optional)
                      </label>
                      <input
                        id="checkout-order-notes"
                        name="order-notes"
                        type="text"
                        autoComplete="off"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="e.g. Call before arriving…"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      />
                    </div>

                    {selectedAddressId === "new" && (
                      <div className="sm:col-span-2 pt-1">
                        <label
                          htmlFor="checkout-save-address"
                          className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700"
                        >
                          <input
                            id="checkout-save-address"
                            type="checkbox"
                            name="save-address"
                            checked={saveAddressToBook}
                            onChange={(e) => setSaveAddressToBook(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 h-4 w-4"
                          />
                          <span>Save this delivery address to my account address book</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Zone & Shipping Method */}
              <div className="surface-3d rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div
                    className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums"
                    aria-hidden="true"
                  >
                    02
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Delivery Zone &amp; Shipping Method
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Select your destination zone and preferred courier transit speed
                    </p>
                  </div>
                </div>

                {/* Delivery Zone Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Select Delivery Zone</span>
                  </label>
                  {isLoadingShipping ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                      <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shippingZones.map((zone) => {
                        const isZoneSelected = zone.id === selectedZoneId;
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            aria-pressed={isZoneSelected}
                            onClick={() => handleZoneChange(zone.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-[border-color,background-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isZoneSelected
                                ? "border-blue-600 bg-blue-50/60 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-black text-sm text-slate-900">
                                {zone.name}
                              </span>
                              {isZoneSelected && (
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                                </span>
                              )}
                            </div>
                            {zone.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {zone.description}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Shipping Methods Selection */}
                {methodsForSelectedZone.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <label className="text-xs font-black text-slate-700 block">
                      Available Shipping Methods ({selectedZone?.name || "Selected Zone"})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {methodsForSelectedZone.map((method) => {
                        const isMethodSelected = method.id === selectedMethodId;
                        const effectiveCost = isFreeShippingEligible ? 0 : Number(method.cost);

                        return (
                          <button
                            key={method.id}
                            type="button"
                            aria-pressed={isMethodSelected}
                            onClick={() => handleMethodChange(method.id)}
                            className={`p-4 rounded-2xl border-2 flex items-start justify-between text-left cursor-pointer transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isMethodSelected
                                ? "border-blue-600 bg-blue-50/50 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isMethodSelected ? "border-blue-600" : "border-slate-300"
                                  }`}
                              >
                                {isMethodSelected && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span>{method.name}</span>
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  Est. {method.estimatedDays} {method.estimatedDays === 1 ? "Working Day" : "Working Days"}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`font-black text-sm tabular-nums shrink-0 ml-2 ${effectiveCost === 0 ? "text-emerald-700" : "text-blue-700"
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

              {/* Step 3: Payment Method Selection */}
              <div className="surface-3d rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div
                    className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums"
                    aria-hidden="true"
                  >
                    03
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Payment Settlement Method
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Zero hidden gateway surcharges on any payment channel
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {isLoadingPaymentMethods ? (
                    <div className="space-y-3" role="status" aria-label="Loading payment methods">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-full p-4 sm:p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/70 animate-pulse flex items-start gap-3.5"
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                            <div className="h-3 bg-slate-200 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>No payment methods currently active. Please contact customer support.</span>
                    </div>
                  ) : (
                    paymentMethods.map((method) => {
                      const isSelected = paymentMethod === method.code;
                      const isPaystation = method.code === "PAYSTATION";
                      const isCod = method.code === "CASH_ON_DELIVERY";
                      const isMfs = method.code === "MOBILE_BANKING";
                      const isBankOrCheck =
                        method.code === "BANK_TRANSFER" || method.code === "CHECK_PAYMENT";

                      return (
                        <div
                          key={method.code}
                          className={`rounded-2xl border-2 transition-[border-color,background-color,box-shadow] overflow-hidden ${isSelected
                            ? isPaystation
                              ? "border-blue-600 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white shadow-xs"
                              : isCod
                                ? "border-blue-600 bg-blue-50/40 shadow-xs"
                                : isMfs
                                  ? "border-blue-600 bg-pink-50/30 shadow-xs"
                                  : isBankOrCheck
                                    ? "border-blue-600 bg-indigo-50/30 shadow-xs"
                                    : "border-blue-600 bg-blue-50/40 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setPaymentMethod(method.code)}
                            className="w-full p-4 sm:p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                          >
                            <div className="flex items-start gap-3.5">
                              <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                    {isPaystation ? (
                                      <ShieldCheck
                                        className="w-4 h-4 text-blue-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    ) : isCod ? (
                                      <Banknote
                                        className="w-4 h-4 text-emerald-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    ) : isMfs ? (
                                      <Smartphone
                                        className="w-4 h-4 text-pink-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    ) : method.code === "BANK_TRANSFER" ? (
                                      <Landmark
                                        className="w-4 h-4 text-indigo-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    ) : method.code === "CHECK_PAYMENT" ? (
                                      <FileCheck2
                                        className="w-4 h-4 text-amber-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <CreditCard
                                        className="w-4 h-4 text-blue-600 shrink-0"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="font-black text-sm text-slate-900 tracking-tight">
                                      {method.name}
                                    </span>
                                  </div>

                                  {/* Visual badges */}
                                  {isPaystation && (
                                    <>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                        <Zap
                                          className="w-3 h-3 fill-amber-300 text-amber-300"
                                          aria-hidden="true"
                                        />
                                        <span>Instant Confirmation</span>
                                      </span>
                                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                        Zero Fee
                                      </span>
                                    </>
                                  )}
                                  {isCod && (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                      Doorstep Cash
                                    </span>
                                  )}
                                  {isMfs && (
                                    <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                                      Direct Wallet
                                    </span>
                                  )}
                                  {method.code === "BANK_TRANSFER" && (
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                      Corporate Wire
                                    </span>
                                  )}
                                  {method.code === "CHECK_PAYMENT" && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                      Cheque / Slip
                                    </span>
                                  )}
                                </div>

                                {method.description && (
                                  <p className="text-xs text-slate-500 leading-relaxed">
                                    {method.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Accepted payment channel badges */}
                            {isPaystation && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                                  Accepted:
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-pink-50 text-[#D12053] border border-pink-200/80">
                                  bKash
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-orange-50 text-[#EA580C] border border-orange-200/80">
                                  Nagad
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-purple-50 text-[#8C3494] border border-purple-200/80">
                                  Rocket
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-blue-50 text-[#1A1F71] border border-blue-200/80">
                                  Visa
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-amber-50 text-[#B45309] border border-amber-200/80">
                                  Mastercard
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                  Net Banking
                                </span>
                              </div>
                            )}

                            {isMfs && !isSelected && (
                              <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                                  Channels:
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-pink-50 text-[#D12053] border border-pink-200/80">
                                  bKash
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-orange-50 text-[#EA580C] border border-orange-200/80">
                                  Nagad
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-purple-50 text-[#8C3494] border border-purple-200/80">
                                  Rocket
                                </span>
                              </div>
                            )}
                          </button>

                          {/* Expanded instruction & input section */}
                          {isSelected && isPaystation && (
                            <div className="mx-4 sm:mx-5 mb-4 p-3 bg-blue-50/80 rounded-xl border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2">
                              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                              <p className="leading-relaxed">
                                {method.instructions ||
                                  "You will be redirected to PayStation's official SSL portal to complete payment with automated verification."}
                              </p>
                            </div>
                          )}

                          {isSelected && isCod && method.instructions && (
                            <div className="mx-4 sm:mx-5 mb-4 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70 text-xs text-emerald-900 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                              <p className="leading-relaxed">
                                {method.instructions}
                              </p>
                            </div>
                          )}

                          {isSelected && isMfs && (
                            <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-200/80 space-y-3">
                              {method.instructions && (
                                <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-900 whitespace-pre-line leading-relaxed font-medium">
                                  {method.instructions}
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label
                                    htmlFor="checkout-mfs-phone"
                                    className="font-bold text-slate-700 block mb-1"
                                  >
                                    Sender Mobile Number <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    id="checkout-mfs-phone"
                                    name="mfs-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    inputMode="tel"
                                    value={mfsSenderPhone}
                                    onChange={(e) => setMfsSenderPhone(e.target.value)}
                                    placeholder="01712345678"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-900 focus:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor="checkout-mfs-trxid"
                                    className="font-bold text-slate-700 block mb-1"
                                  >
                                    Transaction ID (TrxID) <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    id="checkout-mfs-trxid"
                                    name="mfs-trxid"
                                    type="text"
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={mfsTrxId}
                                    onChange={(e) => setMfsTrxId(e.target.value.toUpperCase())}
                                    placeholder="e.g. 9X7B2144A9"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900 uppercase focus:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {isSelected && isBankOrCheck && (
                            <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-200/80 space-y-3">
                              {method.instructions && (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 whitespace-pre-line leading-relaxed font-medium">
                                  {method.instructions}
                                </div>
                              )}

                              <div>
                                <label
                                  htmlFor={`checkout-ref-${method.code}`}
                                  className="font-bold text-slate-700 block mb-1 text-xs"
                                >
                                  Reference / Cheque No. / Slip <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                  id={`checkout-ref-${method.code}`}
                                  name="payment-reference"
                                  type="text"
                                  autoComplete="off"
                                  value={bankTransferRef}
                                  onChange={(e) => setBankTransferRef(e.target.value)}
                                  placeholder="e.g. Bank wire ref, Cheque number, or deposit slip note"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                />
                              </div>
                            </div>
                          )}

                          {isSelected && !isPaystation && !isCod && !isMfs && !isBankOrCheck && method.instructions && (
                            <div className="mx-4 sm:mx-5 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                              {method.instructions}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Sticky 3D Order Review & Submit */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
              <div className="surface-3d rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                  <h3 className="text-base font-black text-slate-900">
                    Order Review (
                    <span className="tabular-nums">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                    )
                  </h3>
                  {isCalculating && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Syncing…</span>
                    </span>
                  )}
                </div>

                {/* Items Thumbnails List */}
                <div className="space-y-3 max-h-56 overflow-y-auto overscroll-contain pr-1 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-2.5 first:pt-0 flex items-center gap-3">
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
                        <div className="text-[11px] text-slate-500 font-medium flex justify-between mt-0.5">
                          <span className="tabular-nums">Qty: {item.quantity}</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {formatBDT(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label
                    htmlFor="checkout-coupon-code"
                    className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Promo / Coupon Code</span>
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                      <div>
                        <span className="font-black text-emerald-800">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-700 block font-semibold tabular-nums">
                          Savings: {formatBDT(discountAmount)}
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
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          id="checkout-coupon-code"
                          name="coupon"
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="e.g. AZDEAL…"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                        >
                          {isApplyingCoupon ? "Applying…" : "Apply"}
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
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatBDT(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>
                      Courier ({selectedZone?.name || selectedDivision} •{" "}
                      {matchingShippingMethod?.name || "Standard"})
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {shippingFee === 0 ? "FREE" : formatBDT(shippingFee)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span className="tabular-nums">-{formatBDT(discountAmount)}</span>
                    </div>
                  )}

                  {calculation?.totalTaxAmount ? (
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Statutory VAT (Inclusive)</span>
                      <span className="tabular-nums">{formatBDT(calculation.totalTaxAmount)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Dark Obsidian 3D Total Payable Pod */}
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
                        VAT &amp; insured courier included
                      </span>
                    </div>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                      {formatBDT(grandTotal)}
                    </span>
                  </div>
                </div>

                {calculation && !calculation.isEligibleForCheckout && (
                  <p
                    role="alert"
                    className="text-[11px] text-rose-600 font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Some items exceed warehouse stock. Please return to cart.</span>
                  </p>
                )}

                {/* Confirm Order CTA */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (calculation !== null && !calculation.isEligibleForCheckout)
                  }
                  className="w-full py-4 px-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-60 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-[background-color,box-shadow,opacity] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Confirming Order…</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      <span>Confirm Order</span>
                    </span>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed">
                  Protected by official manufacturer warranty &amp; 7-day replacement guarantee.
                </p>
              </div>

              {/* 3D Tilt Trust Box */}
              <Tilt3DCard maxTilt={4} scale={1.01}>
                <div className="surface-3d rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                    <span>Official Authorized Warranty</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-bold">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Inspect parcel seal before COD payment</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-bold">
                    <Truck className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                    <span>Express Coverage Across 64 Districts</span>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        </form>
      </div>
    </StorefrontShell>
  );
}
