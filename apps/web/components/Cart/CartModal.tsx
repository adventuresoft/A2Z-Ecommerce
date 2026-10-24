"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  ShieldCheck,
  Lock,
  Truck,
  Flame,
} from "lucide-react";
import { formatBDT, Product } from "../../data/mock-catalog";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (Product & { quantity: number })[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onAddToCart?: (product: Product) => void;
}

export function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onUpdateQuantity,
}: CartModalProps) {
  const [checkoutFeedback, setCheckoutFeedback] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when cart modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleProceedCheckout = () => {
    setCheckoutFeedback(true);
    setTimeout(() => {
      setCheckoutFeedback(false);
      alert(
        `🎉 Proceeding to Secure Checkout!\nTotal Payable: ${formatBDT(
          subtotal
        )}\nItems: ${totalItemsCount} item(s).\n\nThank you for choosing A to Z Ecommerce!`
      );
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with Soft Blur */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                  Shopping Cart
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black bg-blue-100 text-blue-700 rounded-full">
                  {totalItemsCount}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                Review items & checkout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer group flex items-center space-x-1"
            title="Close Drawer (Esc)"
            aria-label="Close Cart"
          >
            <span className="text-[10px] font-bold text-slate-400 tracking-wider group-hover:text-slate-600 hidden sm:inline">
              ESC
            </span>
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Cart Content: Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {cartItems.length === 0 ? (
            /* Empty State */
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-50 via-slate-50 to-orange-50 border border-slate-200/90 flex items-center justify-center text-blue-600 shadow-inner mb-3">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>

              <h4 className="text-sm font-extrabold text-slate-900">
                Your cart is currently empty
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Discover our latest official gadgets, top-rated laptops, and flash
                sales to grab the best deals today!
              </p>

              <button
                onClick={() => {
                  onClose();
                  const el = document.getElementById("flash-sale");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="mt-5 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Explore Today&apos;s Deals</span>
              </button>
            </div>
          ) : (
            /* Item list - Compact Professional Design */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-0.5">
                <span>Items in your order ({totalItemsCount})</span>
                <button
                  onClick={onClearCart}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-center space-x-2.5 p-2 sm:p-2.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all"
                >
                  {/* Compact Thumbnail Image */}
                  <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="60px"
                    />
                  </div>

                  {/* Compact Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded uppercase tracking-wider">
                        {item.category}
                      </span>
                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                        aria-label={`Remove ${item.title}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors mt-0.5">
                      {item.title}
                    </h5>

                    {/* Stepper & Price in one compact row */}
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                      {/* Compact Stepper */}
                      <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              onUpdateQuantity?.(item.id, -1);
                            } else {
                              onRemoveItem(item.id);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                          aria-label={
                            item.quantity > 1 ? "Decrease quantity" : "Remove item"
                          }
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3 h-3 text-red-500" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>

                        <span className="w-5 text-center text-[11px] font-extrabold text-slate-900 select-none">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity?.(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for this line item */}
                      <div className="text-right">
                        <span className="text-[11px] sm:text-xs font-black text-slate-900">
                          {formatBDT(item.price * item.quantity)}
                        </span>
                        <span className="text-[9px] text-slate-400 block leading-none">
                          ({formatBDT(item.price)} each)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Order Summary & Checkout Actions */}
        {cartItems.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-slate-200/90 bg-slate-50/90 shrink-0 space-y-3 shadow-lg">
            {/* Breakdown - Subtotal & Total only (No Estimated Delivery) */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between text-[11px]">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-bold text-slate-800">{formatBDT(subtotal)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                    Total Amount
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    All taxes & VAT included
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-blue-700 leading-tight block">
                    {formatBDT(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleProceedCheckout}
              disabled={checkoutFeedback}
              className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-between shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
                <span>Proceed to Checkout</span>
              </div>
              <div className="flex items-center space-x-1 font-black">
                <span>{formatBDT(subtotal)}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Secondary Option: Continue Shopping */}
            <button
              onClick={onClose}
              className="w-full text-center py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
            >
              Continue Shopping
            </button>

            {/* Trust Assurances */}
            <div className="pt-1 flex items-center justify-around text-[9px] text-slate-500 font-semibold border-t border-slate-200/60">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center space-x-1">
                <Truck className="w-3 h-3 text-emerald-600" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>SSL Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
