"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { motion } from "motion/react";
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
  const soldPercent =
    product.soldCount && product.stockTotal
      ? Math.round((product.soldCount / product.stockTotal) * 100)
      : product.soldCount
      ? Math.min(Math.round((product.soldCount / 300) * 100), 92)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 hover:border-blue-500/80 shadow-2xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group relative h-full"
    >
      {/* Top Badges & Wishlist Action */}
      <div className="flex items-center justify-between gap-1 mb-2.5 z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.discountPercent ? (
            <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
              -{product.discountPercent}%
            </span>
          ) : product.badge ? (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
              {product.badge}
            </span>
          ) : null}

          {product.saveBDT && (
            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
              Save {formatBDT(product.saveBDT)}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product.id);
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
            isWishlisted
              ? "bg-rose-50 text-rose-600 border-rose-200 shadow-xs"
              : "bg-slate-50 hover:bg-white text-slate-400 hover:text-rose-500 border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isWishlisted ? "fill-current text-rose-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Standardized 1:1 Aspect Ratio Image Frame */}
      <Link
        href={`/products/${product.id}`}
        className="relative w-full aspect-square bg-slate-50/80 rounded-xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-2 block group-hover:border-blue-200 transition-colors"
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-2 group-hover:scale-106 transition-transform duration-300 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
        />
      </Link>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category Label */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {product.category}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors mb-1.5 min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>

          {/* Star Ratings */}
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? "fill-current text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              ({product.reviewsCount})
            </span>
          </div>

          {/* Optional Progress Bar (Flash Sale / Best Sellers) */}
          {showProgressBar && soldPercent !== null && (
            <div className="mb-2.5">
              <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                <span>Sold: {product.soldCount}</span>
                <span>{soldPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing and Action Button */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="text-sm sm:text-base font-black text-slate-900 leading-none">
              {formatBDT(product.price)}
            </div>
            {product.regularPrice && (
              <div className="text-[11px] text-slate-400 line-through mt-0.5 leading-none">
                {formatBDT(product.regularPrice)}
              </div>
            )}
          </div>

          {variant === "compact" ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onAddToCart(product)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onAddToCart(product)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
