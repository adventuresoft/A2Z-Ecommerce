"use client";

import React from "react";
import { ShieldCheck, Award } from "lucide-react";

interface BrandItem {
  name: string;
  tagline: string;
  badgeColor?: string;
  fontClass?: string;
}

const BRANDS: BrandItem[] = [
  { name: "ASUS", tagline: "In Search of Incredible", badgeColor: "text-slate-900 font-black tracking-widest" },
  { name: "DELL", tagline: "The Power to Do More", badgeColor: "text-blue-700 font-extrabold tracking-tight" },
  { name: "APPLE", tagline: "Think Different", badgeColor: "text-slate-950 font-semibold tracking-wider" },
  { name: "SAMSUNG", tagline: "Inspire the World", badgeColor: "text-blue-900 font-black tracking-widest" },
  { name: "XIAOMI", tagline: "Innovation for Everyone", badgeColor: "text-orange-600 font-black tracking-normal" },
  { name: "LENOVO", tagline: "Smarter Technology for All", badgeColor: "text-red-600 font-bold tracking-tight" },
  { name: "HP", tagline: "Keep Reinventing", badgeColor: "text-blue-600 font-black italic tracking-tight" },
  { name: "LOGITECH", tagline: "Defy Logic", badgeColor: "text-slate-900 font-black tracking-widest" },
];

interface BrandStripProps {
  brands?: any[];
}

export function BrandStrip({ brands }: BrandStripProps = {}) {
  // If brands is explicitly passed as an empty array, hide cleanly
  if (brands !== undefined && brands.length === 0) {
    return null;
  }

  const items =
    brands && brands.length > 0
      ? brands.map((b) => ({
          name: b.name,
          tagline: b.tagline || "Official Partner Brand",
          badgeColor: "text-slate-900 font-black tracking-widest",
          slug: b.slug,
        }))
      : BRANDS.map((b) => ({ ...b, slug: b.name.toLowerCase() }));
  return (
    <section id="brands" className="py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">
              Authorized Distribution
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Official Partner Brands
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              100% genuine tech products backed by official manufacturer warranties
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Authorized Partner Guarantee</span>
          </div>
        </div>

        {/* Brand Card Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {items.map((brand) => (
            <a
              key={brand.name}
              href={brand.slug ? `/products?brand=${encodeURIComponent(brand.slug)}` : "/products"}
              className="bg-slate-50/80 hover:bg-white rounded-2xl py-4 px-3 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="h-7 flex items-center justify-center">
                <span className={`text-base sm:text-lg transition-transform duration-200 group-hover:scale-105 ${brand.badgeColor}`}>
                  {brand.name}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1 truncate max-w-full">
                {brand.tagline}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
