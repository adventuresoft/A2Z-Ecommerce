"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  ShoppingCart,
  Eye,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../UI/ProductCard";
import {
  SMARTPHONE_DEALS,
  SmartphoneDealProduct,
  Product,
  formatBDT,
} from "../../data/mock-catalog";

interface SmartphoneDealsSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
}

const BRAND_TABS = [
  { id: "all", label: "All Brands" },
  { id: "Samsung", label: "Samsung" },
  { id: "Apple", label: "Apple" },
  { id: "Xiaomi", label: "Xiaomi" },
  { id: "OnePlus", label: "OnePlus" },
  { id: "Realme", label: "Realme" },
  { id: "Vivo", label: "Vivo" },
] as const;

export function SmartphoneDealsSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
}: SmartphoneDealsSectionProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isHeroAdded, setIsHeroAdded] = useState(false);

  // Determine the flagship hero phone based on active brand filter
  const heroPhone: SmartphoneDealProduct = useMemo(() => {
    if (selectedBrand === "all") {
      return SMARTPHONE_DEALS[0]!; // Samsung Galaxy S24 Ultra
    }
    const brandMatch = SMARTPHONE_DEALS.find((p) => p.brand === selectedBrand);
    return brandMatch || SMARTPHONE_DEALS[0]!;
  }, [selectedBrand]);

  // Determine the 6 grid cards (excluding hero phone, brand-focused first, filled to exactly 6)
  const displayProducts: SmartphoneDealProduct[] = useMemo(() => {
    if (selectedBrand === "all") {
      return SMARTPHONE_DEALS.filter((p) => p.id !== heroPhone.id).slice(0, 6);
    }

    const brandDeals = SMARTPHONE_DEALS.filter(
      (p) => p.brand === selectedBrand && p.id !== heroPhone.id
    );
    const otherDeals = SMARTPHONE_DEALS.filter(
      (p) => p.brand !== selectedBrand && p.id !== heroPhone.id
    );

    return [...brandDeals, ...otherDeals].slice(0, 6);
  }, [selectedBrand, heroPhone.id]);

  const handleHeroAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(heroPhone);
    setIsHeroAdded(true);
    setTimeout(() => {
      setIsHeroAdded(false);
    }, 1600);
  };

  return (
    <section
      id="smartphone-deals"
      className="py-14 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/50 border-b border-slate-200/90 scroll-mt-24 relative overflow-hidden"
    >
      {/* Background Decorative Mesh Gradients */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Section Header & Category Anchor */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-black text-blue-700 uppercase tracking-widest mb-1.5 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200/60">
              <Smartphone className="w-3.5 h-3.5 text-blue-600 animate-pulse" aria-hidden="true" />
              <span>Official Smartphone Spotlight</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-[10px] font-bold text-emerald-700 lowercase">btrc verified</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight text-balance">
              Best Deals on Official Smartphones!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
              100% Genuine handsets with Official BTRC Registration, Authorized Brand Warranty &amp; 0% EMI Facilities across Bangladesh.
            </p>
          </div>

          <Link
            href="/category/smartphones"
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 px-4 py-2.5 rounded-xl shadow-2xs transition-all group self-start md:self-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>View All Smartphones</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {/* 2. Interactive Brand Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter smartphones by brand"
          className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none focus-within:ring-1 focus-within:ring-blue-300 rounded-xl"
        >
          {BRAND_TABS.map((tab) => {
            const isActive = selectedBrand === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedBrand(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  isActive
                    ? "text-white shadow-md shadow-blue-700/20"
                    : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBrandPill"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-blue-700 rounded-xl -z-10"
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Bento Grid: Flagship Hero Showcase (Left) + 6-Product Deals Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Bento Flagship Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden shadow-xl border border-slate-800/80 group"
          >
            {/* Ambient Dynamic Background Glows */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600/25 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-16 w-56 h-56 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-4">
              {/* Badges & Trust Seal Row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                  <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
                  <span>Flagship Deal</span>
                </span>

                <span className="inline-flex items-center space-x-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>BTRC Approved</span>
                </span>
              </div>

              {/* Dynamic Hero Product Image with Key Transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroPhone.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full aspect-4/3 bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex items-center justify-center my-3 overflow-hidden group/img"
                >
                  <Image
                    src={heroPhone.image}
                    alt={heroPhone.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 380px"
                    className="object-contain p-3 group-hover/img:scale-108 transition-transform duration-500"
                    priority
                  />

                  {/* Save Tag Ribbon */}
                  {heroPhone.saveBDT > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                      Save {formatBDT(heroPhone.saveBDT)}
                    </div>
                  )}

                  {/* Quick View Pill */}
                  <Link
                    href={`/products/${heroPhone.slug || heroPhone.id}`}
                    className="absolute bottom-2.5 right-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center space-x-1 transition-colors"
                  >
                    <Eye className="w-3 h-3 text-blue-400" aria-hidden="true" />
                    <span>View Details</span>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Title & Brand */}
              <div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {heroPhone.brand} Spotlight
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mt-0.5 line-clamp-2">
                  {heroPhone.title}
                </h3>
              </div>

              {/* Highlight Spec Chips */}
              {heroPhone.specChips && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {heroPhone.specChips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center space-x-1 text-[10px] font-semibold bg-white/10 border border-white/10 text-slate-200 px-2 py-0.5 rounded-md"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-blue-300" aria-hidden="true" />
                      <span>{chip}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* EMI Highlight Box */}
              {heroPhone.emiStarting && (
                <div className="bg-gradient-to-r from-blue-900/60 to-indigo-950/60 border border-blue-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px]">0% EMI Facility</span>
                      <span className="text-white font-bold">
                        From <span className="tabular-nums text-orange-300">{formatBDT(heroPhone.emiStarting)}</span>/month
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    Up to 12 Mo.
                  </span>
                </div>
              )}

              {/* Pricing Row */}
              <div className="pt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                    {formatBDT(heroPhone.price)}
                  </div>
                  {heroPhone.regularPrice && (
                    <div className="text-xs text-slate-400 line-through tabular-nums mt-0.5">
                      {formatBDT(heroPhone.regularPrice)}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>In Stock</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: 1-Click Buy & View Details */}
            <div className="relative z-10 pt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleHeroAddToCart}
                className={`w-full font-bold text-xs py-3.5 px-5 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  isHeroAdded
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
                }`}
                aria-label={
                  isHeroAdded
                    ? `Added ${heroPhone.title} to cart`
                    : `Add ${heroPhone.title} to cart`
                }
              >
                {isHeroAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" aria-hidden="true" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                    <span>Add Flagship Deal to Cart</span>
                  </>
                )}
              </button>

              <Link
                href="/category/smartphones"
                className="w-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-700/80 flex items-center justify-center space-x-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <span>Browse All {selectedBrand === "all" ? "Official" : heroPhone.brand} Phones</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 6-Product Balanced Deals Grid */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4.5">
              <AnimatePresence mode="popLayout">
                {displayProducts.map((phone, idx) => (
                  <motion.div
                    key={`${selectedBrand}-${phone.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: (idx % 6) * 0.03 }}
                    className="h-full"
                  >
                    <ProductCard
                      product={phone}
                      index={idx}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      isWishlisted={wishlistIds.has(phone.id)}
                      variant="compact"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 4. Bottom Official Trust & Guarantee Bar */}
        <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">BTRC IMEI Verified</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant legal verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-orange-500" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">0% EMI Available</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">18+ partner banks in BD</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Official Brand Warranty</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">1-Year authorized support</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Insured Express Delivery</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tamper-proof secure pack</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
