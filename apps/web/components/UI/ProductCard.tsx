"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Check, Flame, ShieldCheck, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, formatBDT } from "../../data/mock-catalog";

export interface ProductCardProps {
  product: Product & {
    saveBDT?: number;
    btrcApproved?: boolean;
    isWishlisted?: boolean;
  };
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  isWishlisted?: boolean;
  showProgressBar?: boolean;
  variant?: "standard" | "compact";
  index?: number;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  showProgressBar = false,
  variant = "standard",
  index = 0,
}: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  // Sold percentage calculation for flash sales
  const soldPercent =
    product.soldCount && product.stockTotal
      ? Math.round((product.soldCount / product.stockTotal) * 100)
      : product.soldCount
      ? Math.min(Math.round((product.soldCount / 300) * 100), 92)
      : null;

  // Save amount calculation
  const computedSaveBDT =
    product.saveBDT ||
    (product.regularPrice && product.regularPrice > product.price
      ? product.regularPrice - product.price
      : null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  const productUrl = `/products/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3, delay: Math.min((index % 6) * 0.04, 0.24), ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="group relative flex flex-col justify-between bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 hover:border-blue-500/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(29,78,216,0.09)] transition-all duration-300 h-full focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 select-none overflow-hidden"
    >
      {/* Top Subtle Ambient Glow Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

      {/* 1. Header Badges & Floating Wishlist Button */}
      <div className="flex items-center justify-between gap-1.5 mb-2 z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.discountPercent ? (
            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs tracking-tight">
              <Flame className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
              <span>-{product.discountPercent}%</span>
            </span>
          ) : product.badge ? (
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
              {product.badge}
            </span>
          ) : null}

          {computedSaveBDT && computedSaveBDT > 0 && (
            <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9px] font-black px-1.5 py-0.5 rounded-full tabular-nums">
              Save {formatBDT(computedSaveBDT)}
            </span>
          )}
        </div>

        {/* Floating Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
            isWishlisted
              ? "bg-rose-50 border-rose-200 text-rose-600 shadow-xs"
              : "bg-white/90 hover:bg-white border-slate-200/80 hover:border-rose-300 text-slate-400 hover:text-rose-600 shadow-2xs"
          }`}
          aria-label={
            isWishlisted
              ? `Remove ${product.title} from wishlist`
              : `Add ${product.title} to wishlist`
          }
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
              isWishlisted
                ? "fill-current text-rose-600 scale-110"
                : "group-hover/btn:scale-110"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 2. Interactive Product Image Canvas with Quick View Hint */}
      <Link
        href={productUrl}
        className="relative w-full aspect-square bg-slate-50/90 group-hover:bg-blue-50/20 rounded-xl overflow-hidden mb-3 border border-slate-100/90 group-hover:border-blue-200/70 transition-colors flex items-center justify-center p-3"
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-2 group-hover:scale-106 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          loading="lazy"
        />

        {/* Quick View Hover Pill on Desktop */}
        <div className="absolute inset-x-3 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 hidden sm:flex items-center justify-center gap-1.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold backdrop-blur-xs shadow-md">
          <Eye className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span>Quick View</span>
        </div>
      </Link>

      {/* 3. Product Info & Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand Tag, Category & In-Stock Micro-indicator */}
          <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              {product.brand ? (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                  {product.brand}
                </span>
              ) : null}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {product.category}
              </span>
            </div>

            {/* Smart In-Stock Indicator */}
            {product.inStock !== false ? (
              <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span className="hidden sm:inline">In Stock</span>
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 shrink-0">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={productUrl} className="block group/title focus-visible:outline-none">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover/title:text-blue-700 transition-colors mb-2 min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>

          {/* Star Rating Badge */}
          <div
            className="flex items-center space-x-1.5 mb-2.5"
            aria-label={`Rated ${product.rating.toFixed(1)} out of 5 stars from ${product.reviewsCount} reviews`}
          >
            <div className="inline-flex items-center gap-1 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200/60 text-amber-900">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="text-[11px] font-black tabular-nums">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tabular-nums">
              ({product.reviewsCount})
            </span>
          </div>

          {/* Flash Sale Stock Progress Bar (Optional) */}
          {showProgressBar && soldPercent !== null && (
            <div className="mb-2.5 bg-orange-50/60 p-1.5 rounded-lg border border-orange-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                <span className="flex items-center gap-1 text-orange-700">
                  <Flame className="w-3 h-3 text-orange-500 fill-current" aria-hidden="true" />
                  Sold: {product.soldCount}
                </span>
                <span className="text-orange-700 tabular-nums">{soldPercent}% Claimed</span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Pricing & Add to Cart Interactive CTA */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 leading-none tabular-nums tracking-tight">
              {formatBDT(product.price)}
            </div>
            {product.regularPrice && product.regularPrice > product.price ? (
              <div className="text-[11px] text-slate-400 line-through mt-1 leading-none tabular-nums">
                {formatBDT(product.regularPrice)}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5 leading-none">
                <ShieldCheck className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                <span>Warranty</span>
              </div>
            )}
          </div>

          {/* Add to Cart Button with Instant Success Feedback */}
          {variant === "compact" ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={handleAddToCart}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 focus-visible:outline-none focus-visible:ring-2 ${
                isAdded
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white hover:shadow-md focus-visible:ring-blue-600"
              }`}
              aria-label={
                isAdded ? `Added ${product.title} to cart` : `Add ${product.title} to cart`
              }
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="w-4 h-4 text-white" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="cart"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 ${
                isAdded
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md"
                  : "bg-blue-700 hover:bg-blue-800 text-white hover:shadow-md focus-visible:ring-blue-600"
              }`}
              aria-label={
                isAdded ? `Added ${product.title} to cart` : `Add ${product.title} to cart`
              }
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="added-state"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Added!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default-state"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center space-x-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
