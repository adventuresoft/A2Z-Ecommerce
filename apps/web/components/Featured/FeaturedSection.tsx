"use client";

import React, { useState } from "react";
import { ProductCard } from "../UI/ProductCard";
import { FEATURED_PRODUCTS, Product } from "../../data/mock-catalog";

interface FeaturedSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
}

export function FeaturedSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
}: FeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<"all" | "laptops" | "gadgets" | "lifestyle">("all");

  const filteredProducts =
    activeTab === "all"
      ? FEATURED_PRODUCTS
      : FEATURED_PRODUCTS.filter((p) => p.tab === activeTab);

  return (
    <section id="featured" className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">
              Curated Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated tech and lifestyle picks chosen by experts with official warranty.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs self-start md:self-auto">
            {(
              [
                { id: "all", label: "All" },
                { id: "laptops", label: "Laptops" },
                { id: "gadgets", label: "Gadgets" },
                { id: "lifestyle", label: "Lifestyle" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Product Cards Grid with unified ProductCard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={wishlistIds.has(product.id)}
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
