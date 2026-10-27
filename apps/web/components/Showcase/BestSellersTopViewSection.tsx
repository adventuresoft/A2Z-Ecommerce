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

  // If live data was provided and both collections are empty, hide cleanly
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

  const products =
    activeTab === "best-sellers" ? liveBestSellers : liveTopViewed;

  return (
    <section id="trending-showcase" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending &amp; Popular Picks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "best-sellers" ? "Best Selling Products" : "Most Viewed Products"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeTab === "best-sellers"
                ? "Most ordered genuine hardware and lifestyle gear by verified customers this month."
                : "The most trending, searched and viewed tech products across Bangladesh this week."}
            </p>
          </div>

          {/* Switcher Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("best-sellers")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "best-sellers"
                  ? "bg-white text-orange-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Best Sellers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("top-viewed")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "top-viewed"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Top Viewed</span>
            </button>
          </div>
        </div>

        {/* Products Grid with Unified ProductCard (5 columns on desktop) */}
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
