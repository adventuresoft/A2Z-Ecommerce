"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, A11y } from "swiper/modules";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Check,
  ShoppingCart,
  Eye,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSafeReducedMotion } from "../../lib/useSafeReducedMotion";

import "swiper/css";
import "swiper/css/navigation";

import { ProductCard } from "../UI/ProductCard";
import { Product, formatBDT } from "../../data/mock-catalog";
import {
  PublicHomeCollection,
  mapSummaryToProduct,
} from "../../lib/curated";

interface CollectionSectionItemProps {
  collection: PublicHomeCollection;
  products: Product[];
  sectionBgClass: string;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds: Set<string>;
}

/**
 * Template: "default" — Categories-style header + 5-Card Product Swiper Slider (autoplay OFF)
 */
function CollectionDefaultSlider({
  collection,
  products,
  sectionBgClass,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}: CollectionSectionItemProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);

  const updateNavState = useCallback((swiper: SwiperType) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  }, []);

  const collectionHref = `/collections/${collection.slug}`;

  return (
    <section
      id={`collection-${collection.slug}`}
      aria-label={collection.name}
      className={`py-8 sm:py-10 ${sectionBgClass} border-b border-slate-200/80 scroll-mt-24 relative`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 max-w-2xl line-clamp-2">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Prev / Next Slider Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                disabled={isBeginning}
                aria-label={`Previous products in ${collection.name}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isBeginning
                    ? "opacity-35 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                    : "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  }`}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                disabled={isEnd}
                aria-label={`Next products in ${collection.name}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isEnd
                    ? "opacity-35 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                    : "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  }`}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* View All Collection Link Button */}
            <Link
              href={collectionHref}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs sm:text-[13px] font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span>View All</span>
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* 5-Card Product Slider (Auto-slider OFF) */}
        <div className="relative -mx-2 px-2">
          <Swiper
            modules={[Navigation, A11y]}
            loop={false}
            autoplay={false}
            speed={550}
            spaceBetween={14}
            slidesPerView={1.5}
            grabCursor={true}
            watchSlidesProgress={true}
            breakpoints={{
              320: { slidesPerView: 1.45, spaceBetween: 12, slidesPerGroup: 1 },
              480: { slidesPerView: 2.15, spaceBetween: 12, slidesPerGroup: 1 },
              640: { slidesPerView: 2.8, spaceBetween: 14, slidesPerGroup: 1 },
              768: { slidesPerView: 3.3, spaceBetween: 14, slidesPerGroup: 1 },
              1024: { slidesPerView: 4, spaceBetween: 16, slidesPerGroup: 1 },
              1280: { slidesPerView: 5, spaceBetween: 16, slidesPerGroup: 1 },
            }}
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
              updateNavState(swiper);
            }}
            onSlideChange={updateNavState}
            onResize={updateNavState}
            onReachBeginning={() => setIsBeginning(true)}
            onReachEnd={() => setIsEnd(true)}
            onFromEdge={updateNavState}
            className="!py-2 !px-1 select-none overflow-hidden"
          >
            {products.map((product, idx) => (
              <SwiperSlide key={product.id} className="!h-auto flex">
                <div className="w-full h-full">
                  <ProductCard
                    product={product}
                    index={idx}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.has(product.id)}
                    variant="compact"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

/**
 * Template: "collection-1" — Smartphone Deals Section Design
 * Header + Dynamic Brand Filter Tabs + Left Flagship Spotlight Card + Right 6-Product Grid
 */
function CollectionTemplateOne({
  collection,
  products,
  sectionBgClass,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}: CollectionSectionItemProps) {
  const prefersReducedMotion = useSafeReducedMotion();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isHeroAdded, setIsHeroAdded] = useState(false);

  const brandTabs = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(
        products
          .map((p) => p.brand?.trim())
          .filter((b): b is string => Boolean(b))
      )
    );
    return [
      { id: "all", label: "All Brands" },
      ...uniqueBrands.map((brand) => ({ id: brand, label: brand })),
    ];
  }, [products]);

  const heroProduct: Product = useMemo(() => {
    if (selectedBrand === "all") {
      return products[0]!;
    }
    const brandMatch = products.find((p) => p.brand === selectedBrand);
    return brandMatch || products[0]!;
  }, [products, selectedBrand]);

  const displayProducts: Product[] = useMemo(() => {
    const rest = products.filter((p) => p.id !== heroProduct.id);
    if (selectedBrand === "all") {
      return rest.slice(0, 6);
    }
    const brandDeals = rest.filter((p) => p.brand === selectedBrand);
    const otherDeals = rest.filter((p) => p.brand !== selectedBrand);
    return [...brandDeals, ...otherDeals].slice(0, 6);
  }, [products, selectedBrand, heroProduct.id]);

  const heroSaveBDT =
    heroProduct.regularPrice && heroProduct.regularPrice > heroProduct.price
      ? heroProduct.regularPrice - heroProduct.price
      : 0;

  const handleHeroAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart(heroProduct);
    setIsHeroAdded(true);
    setTimeout(() => {
      setIsHeroAdded(false);
    }, 1600);
  };

  const collectionHref = `/collections/${collection.slug}`;
  const heroProductUrl = `/product/${heroProduct.slug || heroProduct.id}`;

  return (
    <section
      id={`collection-${collection.slug}`}
      aria-label={collection.name}
      className={`py-14 ${sectionBgClass} border-b border-slate-200/80 scroll-mt-24 relative overflow-hidden`}
    >
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/35 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-10 w-80 h-80 bg-orange-100/25 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            {collection.badgeText && (
              <div className="inline-flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider mb-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/70">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                <span>{collection.badgeText}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight text-balance">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
                {collection.description}
              </p>
            )}
          </div>

          <Link
            href={collectionHref}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 surface-3d hover:border-blue-300 px-4 py-2.5 rounded-xl transition-[border-color,color,box-shadow] group self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span>View All {collection.name}</span>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* 2. Interactive Brand Filter Tabs */}
        {brandTabs.length > 1 && (
          <div
            role="tablist"
            aria-label={`Filter ${collection.name} by brand`}
            className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar rounded-xl"
          >
            {brandTabs.map((tab) => {
              const isActive = selectedBrand === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedBrand(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${isActive
                      ? "text-white shadow-md shadow-blue-700/20"
                      : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId={
                        prefersReducedMotion
                          ? undefined
                          : `activeBrandPill-${collection.id}`
                      }
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-blue-700 rounded-xl -z-10"
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Bento Grid: Flagship Hero Showcase (Left) + 6-Product Deals Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4">
            <div className="h-full rounded-3xl surface-3d-dark bg-tech-grid p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden group">
              <div
                className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600/25 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-16 -left-16 w-56 h-56 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
                    <span>{collection.badgeText || "Flagship Deal"}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Official Warranty</span>
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={heroProduct.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28 }}
                    className="relative w-full aspect-4/3 bg-slate-900/75 rounded-2xl border border-white/12 flex items-center justify-center my-3 overflow-hidden group/img"
                  >
                    <Image
                      src={heroProduct.image}
                      alt={heroProduct.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 380px"
                      className="object-cover group-hover/img:scale-105 transition-transform duration-500"
                    />

                    {heroSaveBDT > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md tabular-nums">
                        Save {formatBDT(heroSaveBDT)}
                      </div>
                    )}

                    <Link
                      href={heroProductUrl}
                      className="absolute bottom-2.5 right-2.5 bg-slate-800/85 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <Eye className="w-3 h-3 text-blue-400" aria-hidden="true" />
                      <span>View Details</span>
                    </Link>
                  </motion.div>
                </AnimatePresence>

                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    {heroProduct.brand || heroProduct.category} Spotlight
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mt-0.5 line-clamp-2">
                    {heroProduct.title}
                  </h3>
                </div>

                {heroProduct.description && (
                  <p className="text-xs text-slate-300/90 line-clamp-2">
                    {heroProduct.description}
                  </p>
                )}

                <div className="pt-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
                      {formatBDT(heroProduct.price)}
                    </div>
                    {heroProduct.regularPrice && heroProduct.regularPrice > heroProduct.price && (
                      <div className="text-xs text-slate-400 line-through tabular-nums mt-0.5">
                        {formatBDT(heroProduct.regularPrice)}
                      </div>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{heroProduct.inStock !== false ? "In Stock" : "Sold Out"}</span>
                  </span>
                </div>
              </div>

              <div className="relative z-10 pt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={handleHeroAddToCart}
                  disabled={heroProduct.inStock === false}
                  className={`w-full font-black text-xs py-3.5 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-[background-color,transform,box-shadow] cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isHeroAdded
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:-translate-y-0.5"
                    }`}
                  aria-label={
                    isHeroAdded
                      ? `Added ${heroProduct.title} to cart`
                      : `Add ${heroProduct.title} to cart`
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
                  href={collectionHref}
                  className="w-full bg-white/8 hover:bg-white/15 text-slate-200 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/15 flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span>
                    Browse All {selectedBrand === "all" ? collection.name : `${selectedBrand} Deals`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Product Balanced Deals Grid */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {(displayProducts.length > 0 ? displayProducts : [heroProduct]).map(
                  (item, idx) => (
                    <motion.div
                      key={`${selectedBrand}-${item.id}`}
                      layout={!prefersReducedMotion}
                      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.24, delay: (idx % 6) * 0.03 }}
                      className="h-full"
                    >
                      <ProductCard
                        product={item}
                        index={idx}
                        onAddToCart={onAddToCart}
                        onToggleWishlist={onToggleWishlist}
                        isWishlisted={wishlistIds.has(item.id)}
                        variant="compact"
                      />
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Template: "collection-2" — Featured Section Design
 * Header on left + Dynamic Product-based Category Segmented Tabs on right + 5-Column Product Grid
 */
function CollectionTemplateTwo({
  collection,
  products,
  sectionBgClass,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}: CollectionSectionItemProps) {
  const prefersReducedMotion = useSafeReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categoryTabs = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((p) => p.category?.trim())
          .filter((c): c is string => Boolean(c))
      )
    );
    return [
      { id: "all", label: "All Curated" },
      ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    const matched = products.filter((p) => p.category === activeCategory);
    return matched.length > 0 ? matched : products;
  }, [products, activeCategory]);

  const collectionHref = `/collections/${collection.slug}`;

  return (
    <section
      id={`collection-${collection.slug}`}
      aria-label={collection.name}
      className={`py-14 ${sectionBgClass} border-b border-slate-200/80 scroll-mt-24`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            {collection.badgeText && (
              <span className="inline-block text-[11px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mb-1.5">
                {collection.badgeText}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Dynamic Product-Based Category Tabs */}
            {categoryTabs.length > 1 && (
              <div
                role="tablist"
                aria-label={`Filter ${collection.name} by category`}
                className="flex items-center gap-1 surface-3d p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-full"
              >
                {categoryTabs.map((tab) => {
                  const isActive = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${isActive
                          ? "text-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={
                            prefersReducedMotion
                              ? undefined
                              : `featuredCategoryTab-${collection.id}`
                          }
                          transition={{ type: "spring", stiffness: 450, damping: 34 }}
                          className="absolute inset-0 bg-slate-900 rounded-xl shadow-xs -z-0"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <Link
              href={collectionHref}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span>View All</span>
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* 5-Column Responsive Product Cards Grid */}
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

interface SingleCollectionSectionProps {
  collection: PublicHomeCollection;
  sectionIndex: number;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
}

function CollectionSectionDispatcher({
  collection,
  sectionIndex,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
}: SingleCollectionSectionProps) {
  const products: Product[] = useMemo(() => {
    if (!Array.isArray(collection.products)) return [];
    return collection.products.map((item) =>
      typeof item.category === "string" && !item.primaryImage
        ? (item as unknown as Product)
        : mapSummaryToProduct(item)
    );
  }, [collection.products]);

  if (products.length === 0) {
    return null;
  }

  // 1-based odd items (1st, 3rd, 5th => sectionIndex % 2 === 0) use #F8FAFC; even items (2nd, 4th => sectionIndex % 2 === 1) use white
  const isOddItem = (sectionIndex + 1) % 2 === 1;
  const sectionBgClass = isOddItem ? "bg-[#F8FAFC]" : "bg-white";
  const template = collection.designTemplate || "default";

  if (template === "collection-1") {
    return (
      <CollectionTemplateOne
        collection={collection}
        products={products}
        sectionBgClass={sectionBgClass}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        wishlistIds={wishlistIds}
      />
    );
  }

  if (template === "collection-2") {
    return (
      <CollectionTemplateTwo
        collection={collection}
        products={products}
        sectionBgClass={sectionBgClass}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        wishlistIds={wishlistIds}
      />
    );
  }

  return (
    <CollectionDefaultSlider
      collection={collection}
      products={products}
      sectionBgClass={sectionBgClass}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      wishlistIds={wishlistIds}
    />
  );
}

interface HomeCollectionSliderSectionProps {
  collections?: PublicHomeCollection[] | null;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
}

export function HomeCollectionSliderSection({
  collections,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}: HomeCollectionSliderSectionProps) {
  const visibleCollections = useMemo(
    () =>
      [...(collections || [])]
        .filter((col) => Array.isArray(col.products) && col.products.length > 0)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [collections]
  );

  if (visibleCollections.length === 0) {
    return null;
  }

  return (
    <>
      {visibleCollections.map((collection, index) => (
        <CollectionSectionDispatcher
          key={collection.id}
          collection={collection}
          sectionIndex={index}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          wishlistIds={wishlistIds}
        />
      ))}
    </>
  );
}
