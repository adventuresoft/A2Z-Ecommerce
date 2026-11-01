"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ProductCard } from "../UI/ProductCard";
import { FEATURED_PRODUCTS, Product } from "../../data/mock-catalog";
import { mapSummaryToProduct } from "../../lib/curated";

interface FeaturedSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
  products?: any[];
}

const TABS = [
  { id: "all", label: "All Curated" },
  { id: "laptops", label: "Laptops" },
  { id: "gadgets", label: "Gadgets" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

export function FeaturedSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
  products,
}: FeaturedSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"all" | "laptops" | "gadgets" | "lifestyle">("all");

  if (products !== undefined && products.length === 0) {
    return null;
  }

  const allProducts: Product[] =
    products !== undefined
      ? products.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : FEATURED_PRODUCTS;

  const filtered =
    activeTab === "all"
      ? allProducts
      : allProducts.filter((p: Product & { tab?: string }) => {
          if (p.tab === activeTab) return true;
          const cat = (p.category || "").toLowerCase();
          if (activeTab === "laptops") return cat.includes("laptop") || cat.includes("computer");
          if (activeTab === "gadgets")
            return cat.includes("gadget") || cat.includes("audio") || cat.includes("phone");
          if (activeTab === "lifestyle")
            return cat.includes("life") || cat.includes("wearable") || cat.includes("watch");
          return false;
        });

  const filteredProducts = filtered.length > 0 ? filtered : allProducts;

  return (
    <section
      id="featured"
      className="py-14 bg-[#F8FAFC] border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-block text-[11px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mb-1.5">
              Editor&apos;s Atelier
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Flagship Gear
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-rated workstations, audio instruments, and everyday tech with authorized warranty.
            </p>
          </div>

          {/* 3D Segmented Category Tabs */}
          <div
            role="tablist"
            aria-label="Filter featured products"
            className="flex items-center gap-1 surface-3d p-1.5 rounded-2xl self-start md:self-auto"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId={prefersReducedMotion ? undefined : "featuredCategoryTab"}
                      transition={{ type: "spring", stiffness: 450, damping: 34 }}
                      className="absolute inset-0 bg-slate-900 rounded-xl shadow-xs -z-0"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Column Responsive 3D Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredProducts.slice(0, 10).map((product, idx) => (
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
