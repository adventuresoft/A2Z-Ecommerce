"use client";

import React, { useState, useEffect } from "react";
import { Zap, ArrowRight } from "lucide-react";
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
  // Live ticking countdown timer
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

  // If products is explicitly an empty array, hide section cleanly
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
    <section id="flash-sale" className="py-10 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Live Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                FLASH SALE
              </h2>
            </div>

            {/* Live Countdown Timer Boxes */}
            <div className="flex items-center space-x-1.5 text-slate-800">
              <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Ends in:</span>
              
              <div className="flex flex-col items-center justify-center bg-slate-900 text-white px-2 py-1 rounded-md min-w-[34px] shadow-xs">
                <span className="text-xs font-black leading-none">{format2Digits(timeLeft.days)}</span>
                <span className="text-[8px] text-slate-400 font-medium">Days</span>
              </div>
              <span className="font-bold text-slate-400">:</span>

              <div className="flex flex-col items-center justify-center bg-slate-900 text-white px-2 py-1 rounded-md min-w-[34px] shadow-xs">
                <span className="text-xs font-black leading-none">{format2Digits(timeLeft.hours)}</span>
                <span className="text-[8px] text-slate-400 font-medium">Hours</span>
              </div>
              <span className="font-bold text-slate-400">:</span>

              <div className="flex flex-col items-center justify-center bg-slate-900 text-white px-2 py-1 rounded-md min-w-[34px] shadow-xs">
                <span className="text-xs font-black leading-none">{format2Digits(timeLeft.minutes)}</span>
                <span className="text-[8px] text-slate-400 font-medium">Mins</span>
              </div>
              <span className="font-bold text-slate-400">:</span>

              <div className="flex flex-col items-center justify-center bg-orange-600 text-white px-2 py-1 rounded-md min-w-[34px] shadow-xs animate-pulse">
                <span className="text-xs font-black leading-none">{format2Digits(timeLeft.seconds)}</span>
                <span className="text-[8px] text-orange-200 font-medium">Secs</span>
              </div>
            </div>
          </div>

          <a
            href="/products?hasDiscount=true"
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group self-start md:self-auto"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Product Cards Grid with Unified ProductCard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {items.map((product, idx) => (
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
