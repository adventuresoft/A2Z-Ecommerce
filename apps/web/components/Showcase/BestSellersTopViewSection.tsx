"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, A11y } from "swiper/modules";
import {
  Flame,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";

import { ProductCard } from "../UI/ProductCard";
import {
  BEST_SELLERS_PRODUCTS,
  TOP_VIEWED_PRODUCTS,
  Product,
} from "../../data/mock-catalog";
import { mapSummaryToProduct } from "../../lib/curated";

interface BestSellersTopViewSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
  bestSellers?: any[];
  topViewed?: any[];
}

export function BestSellersTopViewSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
  bestSellers,
  topViewed,
}: BestSellersTopViewSectionProps) {
  const [activeTab, setActiveTab] = useState<"best-sellers" | "top-viewed">(
    "best-sellers"
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);

  const updateNavState = useCallback((swiper: SwiperType) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  }, []);

  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.slideTo(0, 0);
      swiperInstance.update();
      updateNavState(swiperInstance);
    }
  }, [activeTab, swiperInstance, updateNavState]);

  if (
    bestSellers !== undefined &&
    bestSellers.length === 0 &&
    (topViewed === undefined || topViewed.length === 0)
  ) {
    return null;
  }

  const liveBestSellers: Product[] =
    bestSellers !== undefined
      ? bestSellers.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : BEST_SELLERS_PRODUCTS;

  const liveTopViewed: Product[] =
    topViewed !== undefined
      ? topViewed.map((p) =>
          typeof p.category === "string" && !p.primaryImage
            ? (p as Product)
            : mapSummaryToProduct(p)
        )
      : TOP_VIEWED_PRODUCTS;

  const products =
    activeTab === "best-sellers" ? liveBestSellers : liveTopViewed;

  return (
    <section
      id="trending-showcase"
      className="py-12 sm:py-14 bg-white border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-700 uppercase tracking-wider bg-orange-50 border border-orange-200/70 px-2.5 py-0.5 rounded-full mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Real-Time Demand</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "best-sellers"
                ? "Best Selling Hardware"
                : "Most Viewed Tech"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeTab === "best-sellers"
                ? "Most ordered genuine hardware and lifestyle gear by verified customers this month."
                : "The highest-traffic tech products searched and compared across Bangladesh this week."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Segmented Tab Switcher */}
            <div
              role="tablist"
              aria-label="Trending product views"
              className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "best-sellers"}
                onClick={() => setActiveTab("best-sellers")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  activeTab === "best-sellers"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Flame
                  className="w-4 h-4 text-orange-500"
                  aria-hidden="true"
                />
                <span>Best Sellers</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "top-viewed"}
                onClick={() => setActiveTab("top-viewed")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-[background-color,color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  activeTab === "top-viewed"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Top Viewed</span>
              </button>
            </div>

            {/* Slider Prev / Next Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                disabled={isBeginning}
                aria-label="Previous trending products"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isBeginning
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
                aria-label="Next trending products"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isEnd
                    ? "opacity-35 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                    : "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                }`}
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-Card Product Slider */}
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
              <SwiperSlide key={`${activeTab}-${product.id}`} className="!h-auto flex">
                <div className="w-full h-full">
                  <ProductCard
                    product={product}
                    index={idx}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.has(product.id)}
                    showProgressBar={activeTab === "best-sellers"}
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
