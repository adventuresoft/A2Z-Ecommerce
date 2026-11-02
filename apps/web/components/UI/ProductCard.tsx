"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Check, Flame, ShieldCheck, Eye } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Product, formatBDT } from "../../data/mock-catalog";
import { Tilt3DCard } from "./Tilt3DCard";

export interface ProductCardProps {
  product: Product & {
    saveBDT?: number;
    btrcApproved?: boolean;
    isWishlisted?: boolean;
    emiStarting?: number;
    specChips?: string[];
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
  const prefersReducedMotion = useReducedMotion();

  const soldPercent =
    product.soldCount && product.stockTotal
      ? Math.round((product.soldCount / product.stockTotal) * 100)
      : product.soldCount
      ? Math.min(Math.round((product.soldCount / 300) * 100), 92)
      : null;

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

  const productUrl = `/product/${product.slug || product.id}`;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.28, delay: Math.min((index % 6) * 0.04, 0.2), ease: "easeOut" }}
      className="h-full perspective-stage"
    >
      <Tilt3DCard
        maxTilt={4.5}
        glareOpacity={0.12}
        className="group relative flex flex-col justify-between bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/85 hover:border-blue-500/70 shadow-[0_2px_10px_rgba(15,23,42,0.035)] hover:shadow-[0_18px_36px_-10px_rgba(29,78,216,0.14)] transition-[border-color,box-shadow] duration-300 h-full focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 select-none overflow-hidden"
      >
        {/* Top Specular Accent Bar */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
        />

        {/* 1. Header Badges & Floating Wishlist Button */}
        <div className="flex items-center justify-between gap-1.5 mb-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.discountPercent ? (
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-orange-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs tracking-tight tabular-nums">
                <Flame className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                <span>-{product.discountPercent}%</span>
              </span>
            ) : product.badge ? (
              <span className="bg-blue-700 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs tracking-wide">
                {product.badge}
              </span>
            ) : null}

            {computedSaveBDT && computedSaveBDT > 0 && (
              <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9px] font-black px-1.5 py-0.5 rounded-full tabular-nums">
                Save {formatBDT(computedSaveBDT)}
              </span>
            )}

            {product.btrcApproved && (
              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-blue-600" aria-hidden="true" />
                <span>Official</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-pressed={isWishlisted}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-[background-color,border-color,color,transform] duration-200 cursor-pointer backdrop-blur-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              isWishlisted
                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-2xs"
                : "bg-white/95 hover:bg-rose-50/60 border-slate-200/90 hover:border-rose-300 text-slate-400 hover:text-rose-600 shadow-2xs"
            }`}
            aria-label={
              isWishlisted
                ? `Remove ${product.title} from wishlist`
                : `Add ${product.title} to wishlist`
            }
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                isWishlisted ? "fill-current text-rose-600 scale-110" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* 2. 3D Elevated Product Image Stage */}
        <Link
          href={productUrl}
          className="relative w-full aspect-square bg-gradient-to-b from-slate-50/90 to-slate-100/60 group-hover:from-blue-50/40 group-hover:to-indigo-50/20 rounded-xl overflow-hidden mb-3 border border-slate-100 group-hover:border-blue-200/70 transition-colors duration-300 flex items-center justify-center p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {/* Subtle radial pedestal shadow */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 inset-x-8 h-3 bg-slate-900/10 blur-md rounded-full scale-90 group-hover:scale-105 transition-transform duration-300"
          />

          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-contain p-2.5 group-hover:scale-108 group-hover:-translate-y-1 transition-transform duration-300 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
            loading="lazy"
          />

          {/* Quick View Hover Pill */}
          <div className="absolute inset-x-3 bottom-2.5 opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-200 translate-y-2 group-hover:translate-y-0 hidden sm:flex items-center justify-center gap-1.5 py-1.5 bg-slate-900/90 text-white rounded-lg text-[11px] font-bold backdrop-blur-xs shadow-md">
            <Eye className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>Inspect Details</span>
          </div>
        </Link>

        {/* 3. Product Info & Metadata */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Brand, Category & Live Stock Pulse */}
            <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {product.brand ? (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                    {product.brand}
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {product.category}
                </span>
              </div>

              {product.inStock !== false ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="hidden sm:inline">In Stock</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                  Sold Out
                </span>
              )}
            </div>

            {/* Product Title */}
            <Link
              href={productUrl}
              className="block group/title rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover/title:text-blue-700 transition-colors duration-200 mb-2 min-h-[2.4rem]">
                {product.title}
              </h3>
            </Link>

            {/* Star Rating Badge */}
            <div
              className="flex items-center space-x-1.5 mb-2"
              aria-label={`Rated ${product.rating.toFixed(1)} out of 5 stars from ${product.reviewsCount} reviews`}
            >
              <div className="inline-flex items-center gap-1 bg-amber-50/90 px-1.5 py-0.5 rounded-md border border-amber-200/70 text-amber-900">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" aria-hidden="true" />
                <span className="text-[11px] font-extrabold tabular-nums">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                ({product.reviewsCount})
              </span>
            </div>

            {/* Key Spec Chips */}
            {product.specChips && product.specChips.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {product.specChips.slice(0, 2).map((chip) => (
                  <span
                    key={chip}
                    className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60 truncate max-w-[120px]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {/* Flash Sale Stock Progress Bar */}
            {showProgressBar && soldPercent !== null && (
              <div className="mb-2.5 bg-orange-50/70 p-1.5 rounded-lg border border-orange-200/70">
                <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1 text-orange-700 tabular-nums">
                    <Flame className="w-3 h-3 text-orange-500 fill-current" aria-hidden="true" />
                    Sold: {product.soldCount}
                  </span>
                  <span className="text-orange-700 tabular-nums">{soldPercent}% Claimed</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 h-1.5 rounded-full transition-transform duration-500 origin-left"
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
                <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-0.5 leading-none">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                  <span>Official Warranty</span>
                </div>
              )}
              {product.emiStarting && (
                <div className="text-[10px] text-blue-700 font-bold mt-1 leading-none tabular-nums">
                  EMI {formatBDT(product.emiStarting)}/mo
                </div>
              )}
            </div>

            {variant === "compact" ? (
              <motion.button
                type="button"
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-[background-color,color,box-shadow] duration-200 cursor-pointer shadow-2xs shrink-0 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 ${
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
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
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
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-[background-color,box-shadow] duration-200 cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 ${
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
                      <span>Added</span>
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
      </Tilt3DCard>
    </motion.div>
  );
}
