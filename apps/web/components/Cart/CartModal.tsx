"use client";

import React from "react";
import Image from "next/image";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { formatBDT, Product } from "../../data/mock-catalog";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (Product & { quantity: number })[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
}: CartModalProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-blue-700" />
            <span className="font-extrabold text-slate-900 text-sm">
              Your Shopping Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Your cart is empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Browse our Flash Sale and Featured Products to add items to your cart!
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate">
                    {item.title}
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Qty: {item.quantity} × {formatBDT(item.price)}
                  </span>
                  <div className="text-xs font-black text-orange-600 mt-0.5">
                    {formatBDT(item.price * item.quantity)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="text-base font-black text-slate-900">
                {formatBDT(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Estimated Delivery (Inside Dhaka)</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  alert(
                    "Checkout phase is coming soon in the next update! This is a design mockup."
                  );
                }}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClearCart}
              className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
