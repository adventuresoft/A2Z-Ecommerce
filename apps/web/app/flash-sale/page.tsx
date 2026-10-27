"use client";

import React, { useState, useEffect } from "react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../components/Catalog/ProductCatalogView";
import { Zap, ShieldCheck, Truck, Flame } from "lucide-react";

export default function FlashSalePage() {
  // Live ticking countdown timer
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format2Digits = (num: number) => num.toString().padStart(2, "0");

  const countdownHeroWidget = (
    <div className="bg-slate-900/90 border border-orange-500/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center sm:items-end">
      <div className="flex items-center space-x-1.5 text-orange-400 text-xs font-black uppercase tracking-wider mb-2.5">
        <Flame className="w-4 h-4 fill-current animate-pulse text-orange-500" />
        <span>Deals Expire In</span>
      </div>

      <div className="flex items-center space-x-2 text-white">
        {/* Days */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-orange-400">
            {format2Digits(timeLeft.days)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Days
          </span>
        </div>
        <span className="font-bold text-orange-400 text-lg">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-white">
            {format2Digits(timeLeft.hours)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Hours
          </span>
        </div>
        <span className="font-bold text-slate-500 text-lg">:</span>

        {/* Mins */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-white">
            {format2Digits(timeLeft.minutes)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Mins
          </span>
        </div>
        <span className="font-bold text-slate-500 text-lg">:</span>

        {/* Secs */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-orange-600 to-amber-600 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-md shadow-orange-600/30 ring-1 ring-orange-400/40">
          <span className="text-lg sm:text-xl font-black leading-none font-mono">
            {format2Digits(timeLeft.seconds)}
          </span>
          <span className="text-[9px] text-orange-100 font-bold uppercase tracking-wider mt-0.5">
            Secs
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3 mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300">
        <span className="flex items-center gap-1 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Brand Warranty
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 font-semibold">
          <Truck className="w-3.5 h-3.5 text-blue-400" />
          Express Shipping
        </span>
      </div>
    </div>
  );

  return (
    <StorefrontShell>
      <ProductCatalogView
        title="Mega Flash Sale & Daily Drops"
        subtitle="Massive limited-time discounts on authentic computing gear, smartphones, audio devices, and trending accessories. Prices valid until stocks or timer lasts."
        archiveBadge="⚡ LIMITED TIME FLASH DEALS"
        hasDiscount={true}
        bannerGradient="from-orange-950 via-slate-950 to-red-950 border border-orange-500/30"
        headerExtra={countdownHeroWidget}
      />
    </StorefrontShell>
  );
}
