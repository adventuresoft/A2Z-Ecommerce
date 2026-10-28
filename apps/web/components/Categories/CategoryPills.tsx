"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import {
  BrowseCatalogCategory,
  CategoryTreeNode,
  fetchBrowseCatalogCategories,
  getCategoryStyleTheme,
} from "../../lib/categories";

function getCategoryIcon(slug: string, name: string): React.ReactNode {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  if (s.includes("electro") || n.includes("electro") || s.includes("cpu") || s.includes("chip")) {
    return <Cpu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("comp") || n.includes("comp") || s.includes("laptop") || n.includes("laptop") || s.includes("pc")) {
    return <Laptop className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("phone") || n.includes("phone") || s.includes("mobile") || s.includes("tablet")) {
    return <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("audio") || n.includes("audio") || s.includes("headphone") || s.includes("earbud") || s.includes("sound")) {
    return <Headphones className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("monitor") || n.includes("monitor") || s.includes("display") || s.includes("screen")) {
    return <Monitor className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("camera") || n.includes("camera") || s.includes("photo") || s.includes("video")) {
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
  if (s.includes("fashion") || n.includes("fashion") || s.includes("apparel") || s.includes("shirt") || s.includes("cloth")) {
    return <Shirt className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("watch") || n.includes("watch")) {
    return <Watch className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("home") || n.includes("home") || s.includes("living") || s.includes("kitchen")) {
    return <Home className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("beauty") || n.includes("beauty") || s.includes("health") || s.includes("care")) {
    return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  if (s.includes("sport") || n.includes("sport") || s.includes("fit") || s.includes("gym") || s.includes("outdoor")) {
    return <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
  }
  return <Package className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />;
}

export type CategoryPillItem = BrowseCatalogCategory | CategoryTreeNode;

interface CategoryPillsProps {
  categories?: CategoryPillItem[];
}

export function CategoryPills({ categories: initialCategories }: CategoryPillsProps) {
  const [categories, setCategories] = useState<CategoryPillItem[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCategories);

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

    loadBrowseCatalog();
    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  // If explicitly empty, don't display
  if (!isLoading && categories.length === 0) {
    return null;
  }

  // Display root categories up to 9 items (+1 "All Categories" pill = 10 items)
  const displayCategories = categories.slice(0, 9);

  return (
    <section id="categories" className="py-8 bg-white border-b border-slate-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">
              Browse Catalog
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Popular Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Computer hardware, smartphones, gaming accessories and lifestyle essentials
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group focus-visible:outline-hidden focus-visible:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {/* Responsive Horizontal Scroll on Mobile, Dynamic Grid on Tablet/Desktop */}
        <div className="flex overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-5 md:grid-cols-10 gap-3 sm:gap-4 no-scrollbar">
          {/* 1. All Categories Pill */}
          <Link
            href="/shop"
            className="flex flex-col items-center group cursor-pointer text-center shrink-0 w-20 sm:w-auto transition-transform hover:-translate-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:shadow-md bg-blue-50 text-blue-700 border-2 border-dashed border-blue-300 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors mt-2 leading-tight truncate w-full">
              All Categories
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Full Catalog
            </span>
          </Link>

          {/* 2. Backend Categories */}
          {displayCategories.map((cat) => {
            const theme = getCategoryStyleTheme(cat.slug, cat.name);
            const targetHref = `/category/${cat.slug || cat.id}`;
            const countText =
              cat.productsCount !== undefined
                ? `${cat.productsCount} ${cat.productsCount === 1 ? "item" : "items"}`
                : "children" in cat && Array.isArray((cat as any).children) && (cat as any).children.length > 0
                ? `${(cat as any).children.length} types`
                : "";

            return (
              <Link
                key={cat.id || cat.slug}
                href={targetHref}
                className="flex flex-col items-center group cursor-pointer text-center shrink-0 w-20 sm:w-auto transition-transform hover:-translate-y-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:shadow-md bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700 overflow-hidden relative">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 56px, 64px"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    getCategoryIcon(cat.slug, cat.name)
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors mt-2 leading-tight truncate w-full">
                  {cat.name}
                </span>
                {countText ? (
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:block tabular-nums truncate w-full">
                    {countText}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
