"use client";

import React, { useState } from "react";
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
  Info,
  Calendar,
  PackageCheck,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { useStore } from "../../context/StoreContext";
import { formatBDT } from "../../data/mock-catalog";

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

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalCartPrice, clearCart } = useStore();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("Dhaka");
  const [selectedDistrict, setSelectedDistrict] = useState("Dhaka City (North)");
  const [streetAddress, setStreetAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Shipping & Payment selection
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "card">("cod");

  // Form submission & Order Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    totalAmount: number;
    itemsCount: number;
    customerName: string;
    phone: string;
    address: string;
    deliveryTime: string;
    payment: string;
  } | null>(null);

  // Delivery fee calculation
  const isDhaka = selectedDivision === "Dhaka";
  const baseShippingFee = totalCartPrice >= 100000 ? 0 : isDhaka ? 60 : 120;
  const shippingFee = shippingMethod === "express" ? baseShippingFee + 90 : baseShippingFee;
  const grandTotal = totalCartPrice + shippingFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim() || !streetAddress.trim()) {
      alert("Please fill in your Full Name, Phone Number, and Delivery Street Address.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedOrderId = `AZ-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderData = {
        orderId: generatedOrderId,
        totalAmount: grandTotal,
        itemsCount: cart.reduce((a, b) => a + b.quantity, 0),
        customerName: fullName,
        phone: phoneNumber,
        address: `${streetAddress}, ${selectedDistrict}, ${selectedDivision}`,
        deliveryTime:
          shippingMethod === "express" ? "Within 24 Hours (Express)" : isDhaka ? "24–48 Hours" : "3–5 Working Days",
        payment:
          paymentMethod === "cod"
            ? "Cash on Delivery (COD)"
            : paymentMethod === "bkash"
            ? "bKash Mobile Payment"
            : "Debit / Credit Card",
      };

      setPlacedOrder(orderData);
      clearCart();
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1000);
  };

  // If order was successfully placed, render Order Success Confirmation screen
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
                  {placedOrder.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Total Payable</span>
                <span className="font-black text-sm text-slate-900">
                  {formatBDT(placedOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Method</span>
                <span className="font-bold text-slate-800">{placedOrder.payment}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Estimated Delivery</span>
                <span className="font-bold text-emerald-700 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {placedOrder.deliveryTime}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Shipping Address</span>
                <span className="font-bold text-slate-800 leading-relaxed">
                  {placedOrder.customerName} ({placedOrder.phone})
                  <br />
                  {placedOrder.address}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </StorefrontShell>
    );
  }

  // If cart is empty, prompt to add items
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

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8">
          Express Checkout
        </h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Delivery Information & Payment Method */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Contact & Delivery Address */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
                <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-base font-black text-slate-900">
                    Contact & Delivery Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Full Name */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="font-bold text-slate-700 block">
                      Full Name <span className="text-rose-500">*</span>
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

                  {/* Phone Number with BD validation indicator */}
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

                  {/* Email Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 block">
                      Email Address (Optional, for tracking receipts)
                    </label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="tariqul@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
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
                      Street Address, Flat, House & Road <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. House 42, Road 11, Sector 4, Uttara, Dhaka"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Order Notes */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 block">
                      Delivery Instructions / Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Call before delivery, deliver in afternoon"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Options */}
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
                  <label
                    onClick={() => setShippingMethod("standard")}
                    className={`p-4 rounded-2xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                      shippingMethod === "standard"
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
                      {baseShippingFee === 0 ? "FREE" : formatBDT(baseShippingFee)}
                    </span>
                  </label>

                  <label
                    onClick={() => setShippingMethod("express")}
                    className={`p-4 rounded-2xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                      shippingMethod === "express"
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
                        Same-day / Next-day guaranteed
                      </div>
                    </div>
                    <span className="font-black text-blue-700">
                      {formatBDT(baseShippingFee + 90)}
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
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {paymentMethod === "cod" && (
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
                        Pay cash directly to our delivery courier after receiving and inspecting the package.
                      </p>
                    </div>
                  </label>

                  {/* bKash / Nagad */}
                  <label
                    onClick={() => setPaymentMethod("bkash")}
                    className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === "bkash"
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {paymentMethod === "bkash" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-pink-600" />
                        <span className="font-black text-sm text-slate-900">
                          bKash / Nagad Mobile Banking
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Pay instantly via bKash merchant gateway. Zero transaction fees.
                      </p>
                    </div>
                  </label>

                  {/* Card */}
                  <label
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-2xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-blue-600 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      {paymentMethod === "card" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="font-black text-sm text-slate-900">
                          Credit / Debit Card (Visa, MasterCard, Amex)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        3D Secure SSL transaction with official bank authorization.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Order Items Summary & Final CTA */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-200">
                  Review Your Order ({cart.length} items)
                </h3>

                {/* Items Thumbnails list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
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

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatBDT(totalCartPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee ({selectedDivision})</span>
                    <span className="font-bold text-slate-900">
                      {shippingFee === 0 ? "FREE" : formatBDT(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total Amount</span>
                    <span className="text-blue-700 text-base">{formatBDT(grandTotal)}</span>
                  </div>
                </div>

                {/* Confirm Order CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-60 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Confirming Order..."
                      : `Confirm Order • ${formatBDT(grandTotal)}`}
                  </span>
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium">
                  By confirming order, you agree to our terms of service and genuine product guarantee.
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
              </div>
            </div>
          </div>
        </form>
      </div>
    </StorefrontShell>
  );
}
