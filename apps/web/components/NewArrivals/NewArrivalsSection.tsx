"use client";

import React from "react";
import Link from "next/link";
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
    <section
      id="new-arrivals"
      className="py-12 bg-[#F8FAFC] border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Just Landed Releases
              </h2>
              <p className="text-xs text-slate-500">
                Freshly imported genuine smartphones, ultrabooks, and desk accessories
              </p>
            </div>
          </div>

          <Link
            href="/new-arrivals"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-800 surface-3d px-3.5 py-2 rounded-xl hover:border-blue-300 transition-[border-color,color] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span>All New Arrivals</span>
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {items.slice(0, items.length >= 10 ? 10 : 5).map((product, idx) => (
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
