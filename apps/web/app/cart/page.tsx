"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { useStore } from "../../context/StoreContext";
import { formatBDT } from "../../data/mock-catalog";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, totalCartPrice } = useStore();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [couponError, setCouponError] = useState("");
  const [shippingZone, setShippingZone] = useState<"inside" | "outside">("inside");

  // Calculate Shipping fee
  const shippingFee = totalCartPrice >= 100000 ? 0 : shippingZone === "inside" ? 60 : 120;

  // Coupon handling
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();

    if (code === "AZDEAL") {
      setAppliedCoupon({ code: "AZDEAL", discount: 500 });
      setCouponCode("");
    } else if (code === "TECH10") {
      const discount = Math.round(totalCartPrice * 0.1);
      setAppliedCoupon({ code: "TECH10 (10% OFF)", discount });
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code. Try AZDEAL or TECH10.");
    }
  };

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, totalCartPrice - couponDiscount + shippingFee);

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Shopping Cart</span>
        </nav>

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {cart.length > 0
                ? `You have ${cart.reduce((a, b) => a + b.quantity, 0)} item(s) in your basket.`
                : "Your shopping basket is currently empty."}
            </p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {cart.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Product Image & Info */}
                      <div className="flex items-center space-x-4">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-2 group"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                            sizes="96px"
                          />
                        </Link>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {item.product.category}
                          </span>
                          <Link
                            href={`/products/${item.product.id}`}
                            className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1 block"
                          >
                            {item.product.title}
                          </Link>
                          {item.selectedVariant && (
                            <div className="text-xs text-slate-500 font-medium">
                              Variant: <strong className="text-slate-700">{item.selectedVariant}</strong>
                            </div>
                          )}
                          <div className="text-xs font-semibold text-slate-500 sm:hidden">
                            Unit: {formatBDT(item.price)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Line Price */}
                      <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                        {/* Quantity */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-black text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right sm:min-w-[100px]">
                          <span className="text-sm sm:text-base font-black text-slate-900 block">
                            {formatBDT(lineTotal)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            {formatBDT(item.price)} each
                          </span>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue Shopping CTA Link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-200">
                  Order Summary
                </h2>

                {/* Subtotal */}
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatBDT(totalCartPrice)}</span>
                </div>

                {/* Shipping Estimator */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Delivery Location:</span>
                    <span className="font-mono text-blue-700">
                      {shippingFee === 0 ? "FREE" : formatBDT(shippingFee)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShippingZone("inside")}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        shippingZone === "inside"
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">Inside Dhaka</div>
                      <div className="text-[10px] text-slate-400">৳60 (24–48h)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingZone("outside")}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        shippingZone === "outside"
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold">Outside Dhaka</div>
                      <div className="text-[10px] text-slate-400">৳120 (3–5d)</div>
                    </button>
                  </div>
                  {totalCartPrice >= 100000 && (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center pt-1">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Free shipping unlocked for orders over ৳1,00,000!
                    </p>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Apply Coupon Code</span>
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
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[10px] font-black text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="e.g. AZDEAL"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 uppercase"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-semibold flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {couponError}
                        </p>
                      )}
                    </form>
                  )}
                </div>

                {/* Coupon Discount Row if applied */}
                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-{formatBDT(appliedCoupon.discount)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-slate-900 block">Total Payable</span>
                    <span className="text-[10px] text-slate-400">Inclusive of VAT & delivery</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-blue-700">
                    {formatBDT(grandTotal)}
                  </span>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-sm rounded-xl flex items-center justify-between shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <span>Proceed to Checkout</span>
                  <div className="flex items-center space-x-1">
                    <span>{formatBDT(grandTotal)}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Trust Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Official Warranty Guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Cash on Delivery (COD) Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold">7 Days Easy Return Policy</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Your cart is empty</h2>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Looks like you haven&apos;t added any items to your shopping cart yet. Explore our genuine gadgets and deals!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>Explore Tech Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
