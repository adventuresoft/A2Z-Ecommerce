"use client";

import React from "react";
import Image from "next/image";
import { X, ChevronRight, PhoneCall, ShieldCheck, Tag } from "lucide-react";
import { CATEGORIES } from "../../data/mock-catalog";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
              <Image
                src="/brand/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">A to Z Ecommerce</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Browse Categories
          </div>
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>{cat.name}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Quick Shortcuts
            </div>
            <a
              href="#flash-sale"
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 text-orange-600 text-xs font-bold"
            >
              <Tag className="w-4 h-4" />
              <span>Flash Sale Deals</span>
            </a>
            <a
              href="#featured"
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-700 text-xs font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Official Brands</span>
            </a>
          </div>
        </div>

        {/* Footer Support */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-blue-700" />
            <span>Support: 09678-123456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
