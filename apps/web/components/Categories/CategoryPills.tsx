"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, FreeMode, Autoplay, A11y } from "swiper/modules";

// Swiper core and module styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import {
  Cpu,
  Laptop,
  Gamepad2,
  Smartphone,
  Headphones,
  Monitor,
  Camera,
  Wifi,
  Speaker,
  LayoutGrid,
  ArrowRight,
  Shirt,
  Watch,
  Home,
  Sparkles,
  Dumbbell,
  Package,
  Tv,
  Tablet,
  BookOpen,
  Coffee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BrowseCatalogCategory,
  CategoryTreeNode,
  fetchBrowseCatalogCategories,
} from "../../lib/categories";

function getCategoryIcon(slug: string, name: string): React.ReactNode {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  if (s.includes("electro") || n.includes("electro") || s.includes("cpu") || s.includes("chip")) {
    return <Cpu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("comp") ||
    n.includes("comp") ||
    s.includes("laptop") ||
    n.includes("laptop") ||
    s.includes("pc")
  ) {
    return <Laptop className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("tablet") || n.includes("pad") || s.includes("ipad")) {
    return <Tablet className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("phone") ||
    n.includes("phone") ||
    s.includes("mobile")
  ) {
    return <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("audio") ||
    n.includes("audio") ||
    s.includes("headphone") ||
    s.includes("earbud") ||
    s.includes("sound")
  ) {
    return <Headphones className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("tv") || n.includes("television")) {
    return <Tv className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("monitor") ||
    n.includes("monitor") ||
    s.includes("display") ||
    s.includes("screen")
  ) {
    return <Monitor className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("camera") ||
    n.includes("camera") ||
    s.includes("photo") ||
    s.includes("video")
  ) {
    return <Camera className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("game") || n.includes("game") || s.includes("gaming") || s.includes("console")) {
    return <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("network") || s.includes("wifi") || s.includes("router")) {
    return <Wifi className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("speaker")) {
    return <Speaker className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("fashion") ||
    n.includes("fashion") ||
    s.includes("apparel") ||
    s.includes("shirt") ||
    s.includes("cloth")
  ) {
    return <Shirt className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("watch") || n.includes("watch")) {
    return <Watch className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("kitchen") || s.includes("coffee") || s.includes("cook")) {
    return <Coffee className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("home") || n.includes("home") || s.includes("living")) {
    return <Home className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("beauty") || n.includes("beauty") || s.includes("health") || s.includes("care")) {
    return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (
    s.includes("sport") ||
    n.includes("sport") ||
    s.includes("fit") ||
    s.includes("gym") ||
    s.includes("outdoor")
  ) {
    return <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("book") || n.includes("book") || s.includes("stationery")) {
    return <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  return <Package className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
}

export type CategoryPillItem = BrowseCatalogCategory | CategoryTreeNode;

interface CategoryPillsProps {
  categories?: CategoryPillItem[];
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  infinite?: boolean;
  autoplay?: boolean;
}

export function CategoryPills({
  categories: initialCategories,
  title = "Featured Categories",
  subtitle = "Explore our wide range of tech products",
  viewAllLink = "/shop",
  infinite = true,
  autoplay = true,
}: CategoryPillsProps) {
  const [categories, setCategories] = useState<CategoryPillItem[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCategories);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);

  useEffect(() => {
    if (initialCategories !== undefined) {
      setCategories(initialCategories);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadBrowseCatalog() {
      try {
        const items = await fetchBrowseCatalogCategories();
        if (isMounted && Array.isArray(items)) {
          setCategories(items);
        }
      } catch (err) {
        console.warn("Could not load browse catalog categories for homepage pills:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBrowseCatalog();
    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  // Ensure enough slides for smooth infinite looping across wide breakpoints (up to 9.5 slidesPerView)
  const displayCategories = useMemo(() => {
    if (!infinite || categories.length === 0) return categories;
    const minSlidesForLoop = 20;
    if (categories.length >= minSlidesForLoop) return categories;
    const repeats = Math.ceil(minSlidesForLoop / categories.length);
    return Array.from({ length: repeats }, () => categories).flat();
  }, [categories, infinite]);

  const isLoopEnabled = infinite && displayCategories.length > 1;

  const updateNavState = useCallback(
    (swiper: SwiperType) => {
      if (isLoopEnabled) {
        setIsBeginning(false);
        setIsEnd(false);
        return;
      }
      setIsBeginning(swiper.isBeginning);
      setIsEnd(swiper.isEnd);
    },
    [isLoopEnabled]
  );

  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section
      id="categories"
      aria-label="Popular Categories"
      className="py-8 sm:py-10 bg-white border-b border-slate-200/80 scroll-mt-24 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Custom Next/Prev Swiper Controls */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                disabled={!isLoopEnabled && isBeginning}
                aria-label="Previous categories"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${!isLoopEnabled && isBeginning
                  ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                  : "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                disabled={!isLoopEnabled && isEnd}
                aria-label="Next categories"
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${!isLoopEnabled && isEnd
                  ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                  : "bg-white text-slate-700 border-slate-200/90 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {
          isLoading && (
            <div className="flex items-center gap-3 overflow-hidden py-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[100px] sm:min-w-[120px] bg-slate-50 border border-slate-200/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-between text-center animate-pulse"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-200/80 mb-3" />
                  <div className="w-16 h-3 bg-slate-200/80 rounded mb-1.5" />
                  <div className="w-10 h-2.5 bg-slate-200/60 rounded" />
                </div>
              ))}
            </div>
          )
        }

        {/* Swiper Slider Content */}
        {
          !isLoading && displayCategories.length > 0 && (
            <div className="relative -mx-2 px-2">
              <Swiper
                modules={[Navigation, FreeMode, Autoplay, A11y]}
                loop={isLoopEnabled}
                speed={700}
                autoplay={
                  autoplay && isLoopEnabled
                    ? {
                        delay: 2800,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                    : false
                }
                spaceBetween={12}
                slidesPerView={3.2}
                grabCursor={true}
                watchSlidesProgress={true}
                freeMode={{
                  enabled: true,
                  sticky: false,
                  momentumRatio: 0.8,
                }}
                breakpoints={{
                  320: { slidesPerView: 3.2, spaceBetween: 10, slidesPerGroup: 1 },
                  480: { slidesPerView: 4.2, spaceBetween: 12, slidesPerGroup: 1 },
                  640: { slidesPerView: 5.2, spaceBetween: 14, slidesPerGroup: 1 },
                  768: { slidesPerView: 6.2, spaceBetween: 16, slidesPerGroup: 1 },
                  1024: { slidesPerView: 7.2, spaceBetween: 16, slidesPerGroup: 1 },
                  1280: { slidesPerView: 8.5, spaceBetween: 18, slidesPerGroup: 1 },
                  1536: { slidesPerView: 9.5, spaceBetween: 20, slidesPerGroup: 1 },
                }}
                onSwiper={(swiper) => {
                  setSwiperInstance(swiper);
                  updateNavState(swiper);
                }}
                onSlideChange={updateNavState}
                onProgress={updateNavState}
                className="!py-3 !px-1 select-none overflow-hidden"
              >
                {displayCategories.map((cat, idx) => {
                  const targetHref = `/category/${cat.slug || cat.id}`;
                  const childrenList =
                    "children" in cat && Array.isArray((cat as CategoryTreeNode).children)
                      ? (cat as CategoryTreeNode).children
                      : [];
                  const countText =
                    cat.productsCount !== undefined
                      ? `${cat.productsCount} ${cat.productsCount === 1 ? "item" : "items"}`
                      : childrenList.length > 0
                        ? `${childrenList.length} types`
                        : "Explore";

                  return (
                    <SwiperSlide key={`${cat.id || cat.slug}-${idx}`} className="!h-auto flex">
                      <Link
                        href={targetHref}
                        className="group w-full bg-white rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center border border-slate-200/90 transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/90 text-slate-700 border border-slate-200/80 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 overflow-hidden relative shadow-inner">
                          {cat.imageUrl ? (
                            <Image
                              src={cat.imageUrl}
                              alt={cat.name}
                              fill
                              sizes="(max-width: 640px) 48px, 56px"
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            getCategoryIcon(cat.slug, cat.name)
                          )}
                        </div>
                        <div className="mt-2.5 w-full">
                          <span className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors block truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-500 font-semibold hidden sm:block tabular-nums truncate mt-0.5">
                            {countText}
                          </span>
                        </div>
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )
        }
      </div>
    </section>
  );
}
