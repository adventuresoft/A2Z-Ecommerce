"use client";

import React from "react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { ProductCatalogView } from "../../components/Catalog/ProductCatalogView";
import { Sparkles, ShieldCheck, Clock, Award } from "lucide-react";

export default function NewArrivalsPage() {
  const newArrivalsHeroExtra = (
    <div className="bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-2.5 min-w-[260px]">
      <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-black uppercase tracking-wider">
        <Sparkles className="w-4 h-4 fill-current text-indigo-400" />
        <span>Fresh Drops Highlights</span>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Added Within the Last 7-14 Days</span>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>100% Factory Sealed & Genuine</span>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Official Manufacturer Warranty</span>
        </div>
      </div>
    </div>
  );

  return (
    <StorefrontShell>
      <ProductCatalogView
        title="New Arrivals & Fresh Tech Drops"
        subtitle="Explore the newest technology releases, latest processor generations, flagship smartphones, and modern peripherals freshly stocked in Bangladesh."
        archiveBadge="✨ FRESH RELEASES"
        defaultSort="newest"
        bannerGradient="from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30"
        headerExtra={newArrivalsHeroExtra}
      />
    </StorefrontShell>
  );
}
