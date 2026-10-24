"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, Flame, Sparkles, Tag, ChevronRight } from "lucide-react";
import { CATEGORIES } from "../../data/mock-catalog";

export function MainNav() {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 hidden lg:block relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* ALL CATEGORIES Mega Button */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 flex items-center space-x-2.5 transition-colors cursor-pointer select-none rounded-t-lg"
            >
              <Menu className="w-4 h-4" />
              <span>ALL CATEGORIES</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showCategoryMenu && (
              <div
                onMouseLeave={() => setShowCategoryMenu(false)}
                className="absolute top-full left-0 w-64 bg-white shadow-xl border border-slate-200 rounded-b-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.id === "all" ? "/shop" : `/category/${cat.id}`}
                    onClick={() => setShowCategoryMenu(false)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors text-xs font-medium group"
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Horizontal Nav Links */}
          <div className="flex items-center space-x-7 text-xs font-semibold text-slate-700">
            <Link
              href="/"
              className="text-blue-700 font-bold border-b-2 border-blue-700 py-3.5 transition-colors"
            >
              Home
            </Link>
            <Link href="/shop" className="hover:text-blue-700 py-3.5 transition-colors">
              Shop
            </Link>
            <Link href="/shop" className="hover:text-blue-700 py-3.5 transition-colors flex items-center space-x-1">
              <span>Categories</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Link>
            <Link
              href="/#flash-sale"
              className="hover:text-orange-600 py-3.5 transition-colors flex items-center space-x-1.5"
            >
              <span>Flash Sale</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center shadow-xs">
                <Flame className="w-2.5 h-2.5 mr-0.5" />
                HOT
              </span>
            </Link>
            <Link href="/shop" className="hover:text-blue-700 py-3.5 transition-colors flex items-center space-x-1">
              <span>New Arrivals</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </Link>
            <Link href="/archive" className="hover:text-blue-700 py-3.5 transition-colors flex items-center space-x-1">
              <Tag className="w-3 h-3 text-blue-600" />
              <span>Archive & Clearance</span>
            </Link>
          </div>
        </div>

        {/* Right side Promo Pill */}
        <div className="hidden xl:flex items-center space-x-2 text-xs font-bold text-slate-600">
          <span className="text-orange-600">⚡ Special Coupon:</span>
          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-mono tracking-wider border border-orange-200">
            AZDEAL
          </span>
          <span className="text-slate-400 text-[11px]">(৳500 OFF)</span>
        </div>
      </div>
    </nav>
  );
}
