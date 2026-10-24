"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  Check,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Info,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import {
  Product,
  formatBDT,
  getProductById,
  getRelatedProducts,
  ProductVariantItem,
} from "../../data/mock-catalog";
import { useStore } from "../../context/StoreContext";
import { ProductCard } from "../UI/ProductCard";

interface ProductDetailViewProps {
  productId: string;
}

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isWishlisted, wishlistIds } = useStore();

  const product = getProductById(productId);
  const relatedProducts = getRelatedProducts(productId, 4);

  // Gallery state
  const galleryImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selections
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "overview" | "reviews">("specs");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize default variants
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initial: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (!initial[v.type] && v.inStock) {
          initial[v.type] = v.value;
        }
      });
      setSelectedVariants(initial);
    }
  }, [product]);

  // Track scroll position for mobile bottom sticky buy bar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
          The product you are looking for does not exist or may have been removed from our catalog.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Products</span>
        </Link>
      </div>
    );
  }

  // Calculate dynamic price based on variant selections
  let currentPrice = product.price;
  if (product.variants) {
    Object.entries(selectedVariants).forEach(([type, value]) => {
      const matched = product.variants?.find((v) => v.type === type && v.value === value);
      if (matched?.priceDelta) {
        currentPrice += matched.priceDelta;
      }
    });
  }

  const discountSavings = product.regularPrice ? product.regularPrice - currentPrice : 0;
  const isItemWishlisted = isWishlisted(product.id);

  const selectedVariantSummary = Object.values(selectedVariants).join(" / ");

  const handleAddToCartClick = () => {
    addToCart(product, quantity, selectedVariantSummary || undefined, currentPrice);
  };

  const handleBuyNowClick = () => {
    addToCart(product, quantity, selectedVariantSummary || undefined, currentPrice);
    router.push("/checkout");
  };

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-blue-700 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link href="/shop" className="hover:text-blue-700 transition-colors">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          href={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
          className="hover:text-blue-700 transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-800 font-bold truncate max-w-[240px] sm:max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* 2. Main Product Showcase (Dual-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        {/* Left Column: Interactive Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-28">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs relative">
            {/* Top Overlay Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
              {product.discountPercent && (
                <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                  -{product.discountPercent}% OFF
                </span>
              )}
              {product.badge && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Top Right Action Overlay (Share & Wishlist) */}
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShareClick}
                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-all shadow-2xs cursor-pointer relative"
                aria-label="Share product"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
                {copiedLink && (
                  <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md">
                    Link Copied!
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all shadow-2xs cursor-pointer ${
                  isItemWishlisted
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80"
                }`}
                aria-label={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-4 h-4 ${isItemWishlisted ? "fill-current text-rose-500" : ""}`}
                />
              </button>
            </div>

            {/* Primary Main Image Viewer */}
            <div className="relative w-full aspect-square bg-slate-50/60 rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-slate-100/80">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <Image
                    src={galleryImages[activeImageIndex] || product.image}
                    alt={product.title}
                    fill
                    priority
                    className="object-contain p-2 hover:scale-108 transition-transform duration-300 ease-out cursor-zoom-in"
                    sizes="(max-width: 1024px) 100vw, 550px"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnail Navigation Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center space-x-3 mt-4 overflow-x-auto pb-1 pt-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 p-1 border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? "border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} - view ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Buy Box & Product Attributes */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          {/* Brand & Stock Status Header */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                {product.brand || product.category}
              </span>
              {product.sku && (
                <span className="text-[11px] font-mono text-slate-400">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* In-stock status badge */}
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>In Stock</span>
            </div>
          </div>

          {/* Product Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {product.title}
          </h1>

          {/* Ratings & Reviews summary */}
          <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-slate-200">
            <div className="flex items-center space-x-1">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-current text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-black text-slate-800 ml-1">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("reviews");
                const el = document.getElementById("pdp-deep-dive");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer flex items-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{product.reviewsCount} Customer Reviews</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium flex items-center">
              <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
              Official BTRC / Warranty
            </span>
          </div>

          {/* Pricing Highlight Box */}
          <div className="bg-gradient-to-r from-blue-50/60 via-slate-50/80 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-100/80 mb-6">
            <div className="flex items-baseline space-x-3 mb-1">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                {formatBDT(currentPrice)}
              </span>
              {product.regularPrice && (
                <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                  {formatBDT(product.regularPrice)}
                </span>
              )}
              {discountSavings > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-md shadow-2xs">
                  Save {formatBDT(discountSavings)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Price inclusive of all taxes, VAT, and official retailer warranties in Bangladesh.
            </p>
          </div>

          {/* Key Bulleted Highlights */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Key Highlights</span>
              </h3>
              <ul className="space-y-1.5">
                {product.keyFeatures.slice(0, 4).map((feat, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 font-medium flex items-start space-x-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Variant Selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 mb-6 pt-2 border-t border-slate-200">
              {/* Color Swatches */}
              {product.variants.some((v) => v.type === "color") && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span>Select Color:</span>
                    <span className="text-blue-700 font-extrabold">
                      {selectedVariants.color || "Default"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {product.variants
                      .filter((v) => v.type === "color")
                      .map((colorVar) => {
                        const isSelected = selectedVariants.color === colorVar.value;
                        return (
                          <button
                            key={colorVar.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                color: colorVar.value,
                              }))
                            }
                            className={`group relative p-1 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "border-blue-600 ring-2 ring-blue-600/30 shadow-xs"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                            title={colorVar.value}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10"
                              style={{ backgroundColor: colorVar.colorCode || "#111" }}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Storage / Size / Package Pills */}
              {product.variants.some((v) => v.type === "storage" || v.type === "size") && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span>Option / Configuration:</span>
                    <span className="text-blue-700 font-extrabold">
                      {selectedVariants.storage || selectedVariants.size || "Standard"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants
                      .filter((v) => v.type === "storage" || v.type === "size")
                      .map((pillVar) => {
                        const isSelected =
                          selectedVariants[pillVar.type] === pillVar.value;
                        return (
                          <button
                            key={pillVar.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [pillVar.type]: pillVar.value,
                              }))
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                            }`}
                          >
                            <span>{pillVar.value}</span>
                            {pillVar.priceDelta ? (
                              <span className="ml-1 text-[10px] opacity-80">
                                ({pillVar.priceDelta > 0 ? "+" : ""}
                                {formatBDT(pillVar.priceDelta)})
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity and Dual Action CTAs */}
          <div className="space-y-3 mb-6 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-sm text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist toggle */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isItemWishlisted
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${isItemWishlisted ? "fill-current text-rose-500" : ""}`}
                />
              </button>
            </div>

            {/* Buy Now Immediate Checkout Button */}
            <button
              type="button"
              onClick={handleBuyNowClick}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.99] text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy Now — Instant Checkout</span>
            </button>
          </div>

          {/* Delivery & Trust Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-start space-x-3">
              <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-800">Fast Nationwide Delivery</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Inside Dhaka: <strong>৳60.00</strong> (24–48 Hours) • Outside Dhaka: <strong>৳120.00</strong> (3–5 Days)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-2.5 border-t border-slate-200/60">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-800">100% Genuine & Official Warranty</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Official distributor warranty with replacement coverage and verified IMEI/Serial stickers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-2.5 border-t border-slate-200/60">
              <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-800">7 Days Return Guarantee</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Easy return and exchange policy if items arrive damaged or mismatched.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Dive Section: Tabs (Specifications, Overview, Customer Reviews) */}
      <div id="pdp-deep-dive" className="mb-16 scroll-mt-28">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`py-4 px-6 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center space-x-2 shrink-0 ${
                activeTab === "specs"
                  ? "border-blue-700 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Full Specifications</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-6 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center space-x-2 shrink-0 ${
                activeTab === "overview"
                  ? "border-blue-700 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Product Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-6 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center space-x-2 shrink-0 ${
                activeTab === "reviews"
                  ? "border-blue-700 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Customer Reviews ({product.reviewsCount})</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 sm:p-8">
            {/* Tab 1: Full Specifications Matrix */}
            {activeTab === "specs" && (
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Technical Specifications
                </h3>
                {product.specifications ? (
                  <div className="space-y-6">
                    {Object.entries(product.specifications).map(([groupName, groupFields]) => (
                      <div key={groupName} className="rounded-xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-100 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700">
                          {groupName}
                        </div>
                        <div className="divide-y divide-slate-100">
                          {Object.entries(groupFields).map(([key, val]) => (
                            <div
                              key={key}
                              className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs hover:bg-slate-50/70 transition-colors"
                            >
                              <span className="font-bold text-slate-500 sm:col-span-1">{key}</span>
                              <span className="font-medium text-slate-800 sm:col-span-2 mt-1 sm:mt-0">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-100 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700">
                      General Information
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                        <span className="font-bold text-slate-500">Category</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">{product.category}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                        <span className="font-bold text-slate-500">Brand</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">{product.brand || "Authentic"}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs">
                        <span className="font-bold text-slate-500">Key Features</span>
                        <span className="font-medium text-slate-800 sm:col-span-2">{product.specs || "Standard configuration"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Overview & Description */}
            {activeTab === "overview" && (
              <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                <h3 className="text-lg font-black text-slate-900">
                  About {product.title}
                </h3>
                <p className="text-sm">
                  {product.description ||
                    `Experience unprecedented performance and reliability with the ${product.title}. Sourced through official authorized channels with verified quality guarantees for customers across Bangladesh.`}
                </p>

                {product.keyFeatures && (
                  <div className="mt-6">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                      Features & Capabilities
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {product.keyFeatures.map((feat, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-2.5 text-xs font-semibold text-slate-700"
                        >
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Customer Reviews */}
            {activeTab === "reviews" && (
              <div className="space-y-8">
                {/* Review Header Scorecard */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="sm:col-span-4 flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
                    <span className="text-5xl font-black text-slate-900 leading-none mb-1">
                      {product.rating.toFixed(1)}
                    </span>
                    <div className="flex items-center text-amber-400 my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating) ? "fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Based on {product.reviewsCount} verified ratings
                    </span>
                  </div>

                  <div className="sm:col-span-8 flex flex-col justify-center space-y-1.5">
                    {[
                      { star: "5 Star", pct: 85 },
                      { star: "4 Star", pct: 12 },
                      { star: "3 Star", pct: 2 },
                      { star: "2 Star", pct: 1 },
                      { star: "1 Star", pct: 0 },
                    ].map((row) => (
                      <div key={row.star} className="flex items-center space-x-3 text-xs">
                        <span className="w-12 font-bold text-slate-600">{row.star}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-2 rounded-full"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-slate-500">
                          {row.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Review Comments */}
                <div className="space-y-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                              {rev.userName[0]}
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-800">{rev.userName}</h5>
                              {rev.isVerified && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? "fill-current" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No customer written reviews yet. Be the first verified customer to review!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Related & Recommended Products
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Customers also viewed these genuine items from {product.category}
              </p>
            </div>
            <Link
              href={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View More</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistIds.has(p.id)}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Mobile Sticky Buy Bar (Appears on scroll past hero) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 z-40 lg:hidden shadow-2xl flex items-center justify-between gap-3"
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold block leading-none">
                Total Price
              </span>
              <span className="text-base font-black text-slate-900 leading-tight">
                {formatBDT(currentPrice)}
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-1 max-w-[240px]">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="flex-1 py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNowClick}
                className="py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1 active:scale-98 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buy</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
