"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Flame,
  Cpu,
  Shirt,
  Home,
  HeartPulse,
  Dumbbell,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
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
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryTreeNode[]>(FALLBACK_CATEGORY_TREE);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyCoupon = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("AZDEAL").catch(() => {});
    }
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const isActiveRoute = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
    <nav
      aria-label="Primary Storefront Navigation"
      className="bg-white border-b border-slate-200 hidden lg:block relative z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 h-full min-w-0">
          {/* ALL CATEGORIES Mega Button & Dropdown Container */}
          <div
            ref={menuContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative h-full flex items-center shrink-0"
          >
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              className={`h-9 px-4 rounded-lg font-semibold text-[13px] whitespace-nowrap shrink-0 flex items-center gap-2 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                isOpen
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
              }`}
            >
              <Menu className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>All Categories</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
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
                      href="/collections/flash-sale"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-50/70 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-colors group"
                    >
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-600" />
                        Explore Live Flash Deals
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

          {/* Clean Material Horizontal Nav Links (Strictly Single-Line) */}
          <div className="flex items-center gap-1 text-[13px] font-medium text-slate-700 h-full whitespace-nowrap">
            {/* Home */}
            <Link
              href="/"
              aria-current={isActiveRoute("/") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <span>Home</span>
              {isActiveRoute("/") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-blue-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>

            {/* Flash Sale */}
            <Link
              href="/collections/flash-sale"
              aria-current={isActiveRoute("/collections/flash-sale") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/collections/flash-sale")
                  ? "text-orange-600 font-semibold"
                  : "text-slate-700 hover:text-orange-600"
              }`}
            >
              <span>Flash Sale</span>
              <span className="bg-orange-600 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded inline-flex items-center leading-none">
                HOT
              </span>
              {isActiveRoute("/collections/flash-sale") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-orange-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>

            {/* New Arrivals */}
            <Link
              href="/collections/new-arrivals"
              aria-current={isActiveRoute("/collections/new-arrivals") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/collections/new-arrivals")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <span>New Arrivals</span>
              {isActiveRoute("/collections/new-arrivals") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-blue-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>

            {/* Archive & Clearance */}
            <Link
              href="/collections/archive"
              aria-current={isActiveRoute("/collections/archive") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/collections/archive")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <span>Archive &amp; Clearance</span>
              {isActiveRoute("/collections/archive") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-blue-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>

            {/* Hire a Professional */}
            <Link
              href="/hire"
              aria-current={isActiveRoute("/hire") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/hire")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <span>Hire a Professional</span>
              {isActiveRoute("/hire") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-blue-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>

            {/* Membership */}
            <Link
              href="/membership"
              aria-current={isActiveRoute("/membership") ? "page" : undefined}
              className={`relative h-full px-3 flex items-center whitespace-nowrap shrink-0 transition-colors ${
                isActiveRoute("/membership")
                  ? "text-blue-600 font-semibold"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              <span>Membership</span>
              {isActiveRoute("/membership") && (
                <span
                  className="absolute bottom-0 inset-x-3 h-[3px] bg-blue-600 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          </div>
        </div>

        {/* Right side Simple Material Coupon Chip */}
        <div className="hidden xl:flex items-center shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={handleCopyCoupon}
            title="Click to copy coupon code AZDEAL"
            aria-label="Copy coupon code AZDEAL for 500 Taka off"
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-2 py-1 hover:bg-slate-50 transition-colors"
          >
            <span>Coupon:</span>
            <span
              role="status"
              aria-live="polite"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wide border transition-colors ${
                copiedCoupon
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
            >
              {copiedCoupon ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>COPIED</span>
                </>
              ) : (
                <span>AZDEAL</span>
              )}
            </span>
            <span className="text-slate-400 text-[11px]">(৳500 OFF)</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
