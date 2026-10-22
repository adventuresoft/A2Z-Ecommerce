"use client";

import React from "react";
import { MapPin, PhoneCall, Package, GitCompare, Heart } from "lucide-react";

interface TopUtilityBarProps {
  wishlistCount?: number;
  onOpenWishlist?: () => void;
}

export function TopUtilityBar({ wishlistCount = 0, onOpenWishlist }: TopUtilityBarProps) {
  return (
    <div className="bg-[#0A192F] text-slate-300 text-xs py-2 border-b border-slate-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Location & Support */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Deliver to: <strong className="text-white font-medium">Dhaka, Bangladesh</strong></span>
          </div>
          <div className="hidden md:flex items-center space-x-1.5 hover:text-white transition-colors">
            <PhoneCall className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Helpline: <strong className="text-white font-medium">09678-123456</strong> (10 AM - 8 PM)</span>
          </div>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center space-x-5 text-slate-300">
          <button
            type="button"
            className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Track Order</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Compare</span>
          </button>
          <button
            type="button"
            onClick={onOpenWishlist}
            className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer group"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="bg-rose-500 text-[10px] text-white px-1.5 py-0.2 rounded-full font-bold">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
