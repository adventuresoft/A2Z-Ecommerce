"use client";

import React, { useState } from "react";
import { Flame, Eye, TrendingUp } from "lucide-react";
import { ProductCard } from "../UI/ProductCard";
import {
  BEST_SELLERS_PRODUCTS,
  TOP_VIEWED_PRODUCTS,
  Product,
} from "../../data/mock-catalog";
import { mapSummaryToProduct } from "../../lib/curated";

interface BestSellersTopViewSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
  bestSellers?: any[];
  topViewed?: any[];
}

export function BestSellersTopViewSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
  bestSellers,
  topViewed,
}: BestSellersTopViewSectionProps) {
  const [activeTab, setActiveTab] = useState<"best-sellers" | "top-viewed">("best-sellers");

  if (
    bestSellers !== undefined &&
    bestSellers.length === 0 &&
    (topViewed === undefined || topViewed.length === 0)
  ) {
    return null;
  }

  const liveBestSellers: Product[] =
    bestSellers !== undefined
      ? bestSellers.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : BEST_SELLERS_PRODUCTS;

  const liveTopViewed: Product[] =
    topViewed !== undefined
      ? topViewed.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : TOP_VIEWED_PRODUCTS;

  const products = activeTab === "best-sellers" ? liveBestSellers : liveTopViewed;

  return (
    <section
      id="trending-showcase"
      className="py-14 bg-white border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-700 uppercase tracking-wider bg-orange-50 border border-orange-200/70 px-2.5 py-0.5 rounded-full mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Real-Time Demand</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "best-sellers" ? "Best Selling Hardware" : "Most Viewed Tech"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeTab === "best-sellers"
                ? "Most ordered genuine hardware and lifestyle gear by verified customers this month."
                : "The highest-traffic tech products searched and compared across Bangladesh this week."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Trending product views"
            className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "best-sellers"}
              onClick={() => setActiveTab("best-sellers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeTab === "best-sellers"
                  ? "bg-white text-orange-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
              <span>Best Sellers</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "top-viewed"}
              onClick={() => setActiveTab("top-viewed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeTab === "top-viewed"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>Top Viewed</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {products.slice(0, products.length >= 10 ? 10 : 5).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={wishlistIds.has(product.id)}
              showProgressBar={activeTab === "best-sellers"}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
