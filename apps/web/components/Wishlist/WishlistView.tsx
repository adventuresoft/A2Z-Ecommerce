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
  AlertTriangle,
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useStore, WishlistProductEntry } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { formatBDT } from "../../data/mock-catalog";

interface WishlistViewProps {
  embedded?: boolean;
}

export function WishlistView({ embedded = false }: WishlistViewProps) {
  const {
    wishlistItems,
    isLoadingWishlist,
    removeFromWishlist,
    moveWishlistToCart,
    refreshWishlist,
  } = useStore();
  const { isAuthenticated, user } = useAuth();

  const unavailableItems = wishlistItems.filter((item) => item.isUnavailable);

  const handleRemoveAllUnavailable = async () => {
    for (const item of unavailableItems) {
      await removeFromWishlist(item.productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h1
              className={`${
                embedded ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
              } font-black text-slate-900 tracking-tight`}
            >
              My Saved Wishlist
            </h1>
            {isAuthenticated ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Cloud className="w-3 h-3" />
                <span>Synced across devices</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span>Guest session</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {wishlistItems.length > 0
              ? `You have saved ${wishlistItems.length} favorite item(s)${
                  user ? ` to ${user.name}'s account` : ""
                }.`
              : "Your saved favorites list is currently empty."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isAuthenticated && wishlistItems.length > 0 && (
            <Link
              href="/login?redirect=/wishlist"
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              Sign in to sync across devices
            </Link>
          )}
          <button
            type="button"
            onClick={() => refreshWishlist()}
            disabled={isLoadingWishlist}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Refresh wishlist"
            aria-label="Refresh wishlist items"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingWishlist ? "animate-spin text-blue-600" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {wishlistItems.length > 0 && (
            <Link
              href="/shop"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Unavailable / Discontinued Products Alert Banner */}
      {unavailableItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-start sm:items-center gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {unavailableItems.length}{" "}
              {unavailableItems.length === 1 ? "item in" : "items in"} your
              wishlist{" "}
              {unavailableItems.length === 1 ? "is" : "are"} no longer
              available or discontinued.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveAllUnavailable}
            className="px-3 py-1.5 rounded-xl bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            Remove All Unavailable ({unavailableItems.length})
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingWishlist && wishlistItems.length === 0 ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            embedded ? "lg:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"
          } gap-4 sm:gap-6`}
        >
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-9 bg-slate-100 rounded-xl w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistItems.length > 0 ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            embedded ? "lg:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"
          } gap-4 sm:gap-6`}
        >
          {wishlistItems.map((item: WishlistProductEntry) => {
            const isOut = !item.inStock || item.isUnavailable;
            return (
              <div
                key={item.productId}
                className={`bg-white rounded-3xl p-4 border transition-all duration-200 flex flex-col justify-between group relative ${
                  item.isUnavailable
                    ? "border-rose-200/90 bg-slate-50/60"
                    : "border-slate-200/90 shadow-2xs hover:shadow-lg"
                }`}
              >
                {/* Status Badge Top-Left */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {item.isUnavailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                      <XCircle className="w-3 h-3" />
                      <span>Unavailable</span>
                    </span>
                  ) : !item.inStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      <span>Out of Stock</span>
                    </span>
                  ) : item.discountPercent && item.discountPercent > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                      -{item.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                {/* 1-Click Remove Button Top-Right */}
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  aria-label="Remove from wishlist"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Product Image Frame */}
                <Link
                  href={
                    item.isUnavailable
                      ? "#"
                      : `/products/${item.slug || item.productId}`
                  }
                  onClick={(e) => {
                    if (item.isUnavailable) e.preventDefault();
                  }}
                  className={`relative w-full aspect-square bg-slate-50/80 rounded-2xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-3 block ${
                    item.isUnavailable ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 100vw, 250px"
                  />
                </Link>

                {/* Product Details */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md truncate">
                        {item.category}
                      </span>
                      {!item.isUnavailable && item.inStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      )}
                    </div>

                    <Link
                      href={
                        item.isUnavailable
                          ? "#"
                          : `/products/${item.slug || item.productId}`
                      }
                      onClick={(e) => {
                        if (item.isUnavailable) e.preventDefault();
                      }}
                      className="block mt-1.5"
                    >
                      <h3
                        className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug transition-colors ${
                          item.isUnavailable
                            ? "text-slate-400 line-through"
                            : "text-slate-900 group-hover:text-blue-700"
                        }`}
                      >
                        {item.title}
                      </h3>
                    </Link>

                    {/* Star ratings */}
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {Number(item.rating || 4.8).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        ({item.reviewsCount || 0})
                      </span>
                    </div>
                  </div>

                  {/* Price & Action CTA */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div>
                      <div className="text-base font-black text-slate-900 leading-none">
                        {formatBDT(item.price)}
                      </div>
                      {item.regularPrice && item.regularPrice > item.price && (
                        <div className="text-[11px] text-slate-400 line-through mt-0.5 leading-none">
                          {formatBDT(item.regularPrice)}
                        </div>
                      )}
                    </div>

                    {item.isUnavailable ? (
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.productId)}
                        className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Unavailable</span>
                      </button>
                    ) : isOut ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-3 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed"
                      >
                        <span>Out of Stock</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => moveWishlistToCart(item)}
                        className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-2xs hover:shadow-xs transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Move to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/90 shadow-2xs max-w-lg mx-auto">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-1">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
            Save products you want to track or buy later by clicking the heart
            icon on any product card!
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
  );
}
