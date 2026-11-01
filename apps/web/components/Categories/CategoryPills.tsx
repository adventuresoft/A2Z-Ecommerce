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
  if (
    s.includes("phone") ||
    n.includes("phone") ||
    s.includes("mobile") ||
    s.includes("tablet")
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
  if (s.includes("home") || n.includes("home") || s.includes("living") || s.includes("kitchen")) {
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

    void loadBrowseCatalog();
    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  const displayCategories = categories.slice(0, 9);

  return (
    <section
      id="categories"
      className="py-10 bg-white border-b border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mb-1.5">
              <span>Department Directory</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Tech &amp; Lifestyle Categories
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:text-blue-800 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 px-3.5 py-2 rounded-xl transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* 3D Pedestal Category Strip */}
        <div className="flex overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-5 lg:grid-cols-10 gap-3 no-scrollbar">
          {/* 1. All Categories Pedestal */}
          <Link
            href="/shop"
            className="surface-3d rounded-2xl p-3 flex flex-col items-center justify-between text-center shrink-0 w-24 sm:w-auto group cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="mt-2.5 w-full">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors block truncate">
                All Gear
              </span>
              <span className="text-[10px] text-blue-600 font-bold hidden sm:block mt-0.5">
                Full Store
              </span>
            </div>
          </Link>

          {/* 2. Dynamic Category Pedestals */}
          {displayCategories.map((cat) => {
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
              <Link
                key={cat.id || cat.slug}
                href={targetHref}
                className="surface-3d rounded-2xl p-3 flex flex-col items-center justify-between text-center shrink-0 w-24 sm:w-auto group cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-700 border border-slate-200/80 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-200 overflow-hidden relative shadow-inner">
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
                  <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors block truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold hidden sm:block tabular-nums truncate mt-0.5">
                    {countText}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
