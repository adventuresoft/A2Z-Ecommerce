"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Flame,
  Sparkles,
  Tag,
  Cpu,
  Shirt,
  Home,
  HeartPulse,
  Dumbbell,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
} from "lucide-react";
import {
  CategoryTreeNode,
  fetchCategoryTree,
  getCategoryStyleTheme,
  FALLBACK_CATEGORY_TREE,
} from "../../lib/categories";

// Helper to render dynamic icon based on theme
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Cpu":
      return <Cpu className={className} />;
    case "Shirt":
      return <Shirt className={className} />;
    case "Home":
      return <Home className={className} />;
    case "HeartPulse":
      return <HeartPulse className={className} />;
    case "Dumbbell":
      return <Dumbbell className={className} />;
    default:
      return <Layers className={className} />;
  }
}

export function MainNav() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>(FALLBACK_CATEGORY_TREE);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>("");

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load category tree from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const tree = await fetchCategoryTree();
        if (isMounted && tree.length > 0) {
          setCategories(tree);
          setActiveSlug(tree[0]?.slug || "");
        }
      } catch (err) {
        console.warn("Failed to load category tree:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When categories change or load, default activeSlug to the first category if empty
  useEffect(() => {
    if (categories.length > 0 && !activeSlug && categories[0]) {
      setActiveSlug(categories[0].slug);
    }
  }, [categories, activeSlug]);

  // Smooth hover handlers with 180ms buffer to eliminate accidental closures
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Find currently hovered parent category
  const activeCategory =
    categories.find((cat) => cat.slug === activeSlug) || categories[0] || null;
  const activeTheme = activeCategory
    ? getCategoryStyleTheme(activeCategory.slug, activeCategory.name)
    : null;

  return (
    <nav className="bg-white border-b border-slate-200 hidden lg:block relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* ALL CATEGORIES Mega Button & Dropdown Container */}
          <div
            ref={menuContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              className={`bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 flex items-center space-x-2.5 transition-all cursor-pointer select-none rounded-t-lg shadow-xs ${
                isOpen ? "bg-blue-800 ring-2 ring-blue-400/30" : ""
              }`}
            >
              <Menu className="w-4 h-4 shrink-0" />
              <span>ALL CATEGORIES</span>
              <ChevronDown
                className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mega Dropdown Panel */}
            {isOpen && (
              <div
                role="menu"
                aria-label="Category Navigation"
                className="absolute top-full left-0 z-50 flex bg-white shadow-2xl border border-slate-200/90 rounded-b-2xl rounded-tr-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ring-1 ring-black/5"
                style={{ width: "940px" }}
              >
                {/* Left Column: Root Categories List */}
                <div className="w-72 bg-slate-50/80 border-r border-slate-200/80 py-3 flex flex-col justify-between shrink-0">
                  <div className="space-y-1 px-2 overflow-y-auto max-h-[460px]">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Explore Departments
                    </div>

                    {isLoading ? (
                      // Skeleton loader while fetching backend
                      <div className="space-y-2 p-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-10 bg-slate-200/70 rounded-xl animate-pulse"
                          />
                        ))}
                      </div>
                    ) : (
                      categories.map((cat) => {
                        const theme = getCategoryStyleTheme(cat.slug, cat.name);
                        const isSelected = activeSlug === cat.slug;
                        const hasChildren = Boolean(cat.children && cat.children.length > 0);

                        return (
                          <div
                            key={cat.id}
                            onMouseEnter={() => setActiveSlug(cat.slug)}
                            className={`w-full group rounded-xl transition-all cursor-pointer flex items-center justify-between px-3 py-2.5 text-xs font-semibold select-none ${
                              isSelected
                                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold"
                                : "text-slate-700 hover:bg-white/80 hover:text-blue-700"
                            }`}
                          >
                            <Link
                              href={`/category/${cat.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center space-x-3 flex-1 min-w-0"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : `${theme.badgeBg} group-hover:scale-105 transition-transform`
                                }`}
                              >
                                <CategoryIcon name={theme.iconName} className="w-4 h-4" />
                              </div>
                              <span className="truncate">{cat.name}</span>
                            </Link>

                            {hasChildren && (
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-all shrink-0 ml-1.5 ${
                                  isSelected
                                    ? "text-blue-700 translate-x-0.5"
                                    : "text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Left Column Bottom Link */}
                  <div className="p-3 border-t border-slate-200/70 mx-2 mt-2">
                    <Link
                      href="/shop"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors group"
                    >
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Browse All Products
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Right Panel: Subcategories Mega View */}
                <div className="flex-1 bg-white p-6 flex flex-col justify-between overflow-y-auto max-h-[500px]">
                  {activeCategory ? (
                    <div>
                      {/* Top Header of Active Category */}
                      <div className="flex items-start justify-between pb-4 mb-5 border-b border-slate-100">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                              {activeCategory.name}
                            </h3>
                            {activeCategory.children?.length > 0 && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                                {activeCategory.children.length} Sub-categories
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {activeTheme?.tagline ||
                              "Verified authentic products with nationwide delivery"}
                          </p>
                        </div>

                        <Link
                          href={`/category/${activeCategory.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group shrink-0 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                          <span>Explore {activeCategory.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>

                      {/* Subcategories Grid */}
                      {activeCategory.children && activeCategory.children.length > 0 ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                          {activeCategory.children.map((sub) => (
                            <div key={sub.id} className="space-y-2">
                              {/* Level 2 Subcategory Heading */}
                              <Link
                                href={`/category/${sub.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="group flex items-center space-x-1.5 text-xs font-black text-slate-900 hover:text-blue-700 transition-colors"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
                                <span className="hover:underline decoration-blue-600 underline-offset-4">
                                  {sub.name}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                              </Link>

                              {/* Level 3 Children items if any */}
                              {sub.children && sub.children.length > 0 ? (
                                <ul className="pl-3 space-y-1.5 border-l border-slate-100">
                                  {sub.children.map((leaf) => (
                                    <li key={leaf.id}>
                                      <Link
                                        href={`/category/${leaf.slug}`}
                                        onClick={() => setIsOpen(false)}
                                        className="text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:translate-x-1 transition-all flex items-center space-x-1 group/item"
                                      >
                                        <span className="text-slate-300 group-hover/item:text-blue-500 font-bold">
                                          ›
                                        </span>
                                        <span>{leaf.name}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <Link
                                  href={`/category/${sub.slug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-[11px] font-medium text-slate-400 hover:text-blue-600 block pl-3"
                                >
                                  View all {sub.name} items →
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center space-y-3">
                          <p className="text-sm font-semibold text-slate-700">
                            Explore all items in {activeCategory.name}
                          </p>
                          <Link
                            href={`/category/${activeCategory.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                          >
                            Browse Catalog
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-slate-400">
                      Hover over any category on the left to see subcategories
                    </div>
                  )}

                  {/* Bottom Promotional / Trust Banner */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>100% Genuine</span>
                      </div>
                      <div className="hidden sm:flex items-center space-x-1.5 text-slate-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>Official Brand Warranty</span>
                      </div>
                    </div>

                    {activeCategory?.imageUrl ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                          Featured Collection:
                        </span>
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                          <Image
                            src={activeCategory.imageUrl}
                            alt={activeCategory.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Horizontal Nav Links */}
          <div className="flex items-center space-x-7 text-xs font-semibold text-slate-700">
            <Link
              href="/"
              className="text-blue-700 font-bold border-b-2 border-blue-700 py-3.5 transition-colors"
            >
              Home
            </Link>
            <Link href="/shop" className="hover:text-blue-700 py-3.5 transition-colors">
              Shop
            </Link>
            <Link
              href="/flash-sale"
              className="hover:text-orange-600 py-3.5 transition-colors flex items-center space-x-1.5"
            >
              <span>Flash Sale</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center shadow-xs">
                <Flame className="w-2.5 h-2.5 mr-0.5" />
                HOT
              </span>
            </Link>
            <Link href="/new-arrivals" className="hover:text-blue-700 py-3.5 transition-colors flex items-center space-x-1">
              <span>New Arrivals</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </Link>
            <Link href="/archive" className="hover:text-blue-700 py-3.5 transition-colors flex items-center space-x-1">
              <Tag className="w-3 h-3 text-blue-600" />
              <span>Archive & Clearance</span>
            </Link>
          </div>
        </div>

        {/* Right side Promo Pill */}
        <div className="hidden xl:flex items-center space-x-2 text-xs font-bold text-slate-600">
          <span className="text-orange-600">⚡ Special Coupon:</span>
          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-mono tracking-wider border border-orange-200">
            AZDEAL
          </span>
          <span className="text-slate-400 text-[11px]">(৳500 OFF)</span>
        </div>
      </div>
    </nav>
  );
}
