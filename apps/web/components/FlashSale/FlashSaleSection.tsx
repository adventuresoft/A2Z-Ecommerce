"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Flame } from "lucide-react";
import { ProductCard } from "../UI/ProductCard";
import { FLASH_SALE_PRODUCTS, Product } from "../../data/mock-catalog";
import { mapSummaryToProduct } from "../../lib/curated";

interface FlashSaleSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
  products?: any[];
}

export function FlashSaleSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
  products,
}: FlashSaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 15,
    minutes: 47,
    seconds: 32,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
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

  if (products !== undefined && products.length === 0) {
    return null;
  }

  const items: Product[] =
    products !== undefined
      ? products.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : FLASH_SALE_PRODUCTS;

  const format2Digits = (num: number) => num.toString().padStart(2, "0");

  return (
    <section
      id="flash-sale"
      className="py-12 bg-[#F8FAFC] border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3D Spatial Countdown Header Banner */}
        <div className="surface-3d-dark bg-tech-grid rounded-3xl p-5 sm:p-6 mb-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl"
          />

          <div className="relative z-10 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
                <Zap className="w-6 h-6 fill-current" aria-hidden="true" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
                  <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
                  <span>Limited Allocation</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Flash Tech Drops
                </h2>
              </div>
            </div>

            {/* Live Countdown Telemetry Boxes */}
            <div
              className="flex items-center gap-1.5"
              aria-label={`Flash sale ends in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
            >
              <span className="text-xs font-bold text-slate-400 mr-1.5 hidden sm:inline">
                Ends in:
              </span>

              {[
                { val: timeLeft.days, label: "Days", highlight: false },
                { val: timeLeft.hours, label: "Hrs", highlight: false },
                { val: timeLeft.minutes, label: "Min", highlight: false },
                { val: timeLeft.seconds, label: "Sec", highlight: true },
              ].map((unit, idx) => (
                <React.Fragment key={unit.label}>
                  <div
                    className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl min-w-[44px] border ${
                      unit.highlight
                        ? "bg-orange-600 border-orange-400/50 text-white shadow-md shadow-orange-600/30"
                        : "bg-white/8 border-white/15 text-white"
                    }`}
                  >
                    <span className="text-sm font-black leading-none tabular-nums font-mono">
                      {format2Digits(unit.val)}
                    </span>
                    <span
                      className={`text-[9px] font-bold mt-0.5 uppercase ${
                        unit.highlight ? "text-orange-100" : "text-slate-400"
                      }`}
                    >
                      {unit.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <span className="font-black text-slate-500" aria-hidden="true">
                      :
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Link
            href="/flash-sale"
            className="relative z-10 inline-flex items-center gap-1.5 text-xs font-black text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl transition-colors group self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <span>All Flash Deals</span>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* 5-Column Responsive 3D Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {items.slice(0, items.length >= 10 ? 10 : 5).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={wishlistIds.has(product.id)}
              showProgressBar={true}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
