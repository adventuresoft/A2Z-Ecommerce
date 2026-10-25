"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { StorefrontShell } from "../../components/Shell/StorefrontShell";
import { useStore } from "../../context/StoreContext";
import { ALL_PRODUCTS, formatBDT } from "../../data/mock-catalog";

export default function WishlistPage() {
  const { wishlistIds, toggleWishlist, addToCart } = useStore();

  const wishlistedProducts = ALL_PRODUCTS.filter((p) => wishlistIds.has(p.id));

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Header */}
        <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">My Wishlist</span>
        </nav>

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                My Saved Wishlist
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {wishlistedProducts.length > 0
                ? `You have saved ${wishlistedProducts.length} favorite item(s).`
                : "Your saved favorites list is currently empty."}
            </p>
          </div>

          {wishlistedProducts.length > 0 && (
            <Link
              href="/shop"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Image Frame */}
                <Link
                  href={`/products/${product.slug || product.id}`}
                  className="relative w-full aspect-square bg-slate-50/80 rounded-2xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-3 block"
                >
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 100vw, 250px"
                  />
                </Link>

                {/* Details */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>

                    <Link href={`/products/${product.slug || product.id}`} className="block mt-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Star ratings */}
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        ({product.reviewsCount})
                      </span>
                    </div>
                  </div>

                  {/* Price & Move to Cart Button */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div>
                      <div className="text-base font-black text-slate-900 leading-none">
                        {formatBDT(product.price)}
                      </div>
                      {product.regularPrice && (
                        <div className="text-[11px] text-slate-400 line-through mt-0.5 leading-none">
                          {formatBDT(product.regularPrice)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-2xs hover:shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Heart className="w-10 h-10 fill-current" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Save products you want to track or buy later by clicking the heart icon on any product card!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
