"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { ProductCard } from "../UI/ProductCard";
import { NEW_ARRIVALS_PRODUCTS, Product } from "../../data/mock-catalog";
import { mapSummaryToProduct } from "../../lib/curated";

interface NewArrivalsSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
  products?: any[];
}

export function NewArrivalsSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
  products,
}: NewArrivalsSectionProps) {
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
      : NEW_ARRIVALS_PRODUCTS;

  return (
    <section id="new-arrivals" className="py-10 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                NEW ARRIVALS
              </h2>
              <p className="text-xs text-slate-500">
                Freshly released genuine gadgets, smartphones, and workspace essentials
              </p>
            </div>
          </div>

          <a
            href="/products?sortBy=newest"
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group"
          >
            <span>View All</span>
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
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
