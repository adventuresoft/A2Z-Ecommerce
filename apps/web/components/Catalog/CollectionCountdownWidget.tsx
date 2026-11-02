"use client";

import React, { useState, useEffect } from "react";
import { Flame, ShieldCheck, Truck } from "lucide-react";

interface CollectionCountdownWidgetProps {
  endDate: string | Date;
  badgeText?: string | null;
}

export function CollectionCountdownWidget({
  endDate,
  badgeText = "Deals Expire In",
}: CollectionCountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const target = new Date(endDate).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/60 backdrop-blur-md rounded-2xl p-4 shadow-xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Campaign Ended
        </span>
      </div>
    );
  }

  const format2Digits = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="bg-slate-900/90 border border-orange-500/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center sm:items-end">
      <div className="flex items-center space-x-1.5 text-orange-400 text-xs font-black uppercase tracking-wider mb-2.5">
        <Flame className="w-4 h-4 fill-current animate-pulse text-orange-500" aria-hidden="true" />
        <span>{badgeText || "Deals Expire In"}</span>
      </div>

      <div
        className="flex items-center space-x-2 text-white"
        aria-label={`Deals expire in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
      >
        {/* Days */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-orange-400 tabular-nums">
            {format2Digits(timeLeft.days)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Days
          </span>
        </div>
        <span className="font-bold text-orange-400 text-lg" aria-hidden="true">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-white tabular-nums">
            {format2Digits(timeLeft.hours)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Hours
          </span>
        </div>
        <span className="font-bold text-slate-500 text-lg" aria-hidden="true">:</span>

        {/* Mins */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-inner">
          <span className="text-lg sm:text-xl font-black leading-none font-mono text-white tabular-nums">
            {format2Digits(timeLeft.minutes)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Mins
          </span>
        </div>
        <span className="font-bold text-slate-500 text-lg" aria-hidden="true">:</span>

        {/* Secs */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-orange-600 to-amber-600 text-white px-2.5 py-1.5 rounded-xl min-w-[48px] shadow-md shadow-orange-600/30 ring-1 ring-orange-400/40">
          <span className="text-lg sm:text-xl font-black leading-none font-mono tabular-nums">
            {format2Digits(timeLeft.seconds)}
          </span>
          <span className="text-[9px] text-orange-100 font-bold uppercase tracking-wider mt-0.5">
            Secs
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3 mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-300">
        <span className="flex items-center gap-1 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          Brand Warranty
        </span>
        <span aria-hidden="true">•</span>
        <span className="flex items-center gap-1 font-semibold">
          <Truck className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          Express Shipping
        </span>
      </div>
    </div>
  );
}

