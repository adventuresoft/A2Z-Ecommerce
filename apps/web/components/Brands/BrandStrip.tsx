"use client";

import React from "react";
import Link from "next/link";
import { Award } from "lucide-react";

interface BrandItem {
  name: string;
  tagline: string;
  badgeColor?: string;
}

const BRANDS: BrandItem[] = [
  { name: "ASUS", tagline: "In Search of Incredible", badgeColor: "text-slate-900 font-black tracking-widest" },
  { name: "DELL", tagline: "The Power to Do More", badgeColor: "text-blue-700 font-extrabold tracking-tight" },
  { name: "APPLE", tagline: "Authorized Reseller", badgeColor: "text-slate-950 font-black tracking-wider" },
  { name: "SAMSUNG", tagline: "Official Galaxy Partner", badgeColor: "text-blue-900 font-black tracking-widest" },
  { name: "XIAOMI", tagline: "Innovation for Everyone", badgeColor: "text-orange-600 font-black tracking-normal" },
  { name: "LENOVO", tagline: "Smarter Technology", badgeColor: "text-red-600 font-black tracking-tight" },
  { name: "HP", tagline: "Keep Reinventing", badgeColor: "text-blue-600 font-black italic tracking-tight" },
  { name: "LOGITECH", tagline: "Precision Peripherals", badgeColor: "text-slate-900 font-black tracking-widest" },
];

interface BrandStripProps {
  brands?: any[];
}

export function BrandStrip({ brands }: BrandStripProps = {}) {
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
    <section
      id="brands"
      className="py-11 bg-white border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <span className="inline-block text-[11px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mb-1.5">
              Authorized Distribution
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Official Partner Brands
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/80 self-start sm:self-auto">
            <Award className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Direct Manufacturer Warranty</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {items.map((brand) => (
            <Link
              key={brand.name}
              href={brand.slug ? `/shop?brand=${encodeURIComponent(brand.slug)}` : "/shop"}
              className="surface-3d rounded-2xl py-4 px-3 hover:border-blue-400 hover:-translate-y-1 hover:shadow-lg transition-[transform,border-color,box-shadow] duration-200 flex flex-col items-center justify-center text-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="h-7 flex items-center justify-center">
                <span
                  className={`text-base sm:text-lg transition-transform duration-200 group-hover:scale-105 ${brand.badgeColor}`}
                >
                  {brand.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 truncate max-w-full">
                {brand.tagline}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
