"use client";

import React, { useState, useEffect, useTransition, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  Grid,
  List,
  Star,
  Check,
  RotateCcw,
  Sparkles,
  Filter,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Heart,
} from "lucide-react";
import {
  Product,
  formatBDT,
  ALL_PRODUCTS,
  getAllCategories,
  getAllBrands,
} from "../../data/mock-catalog";
import { ProductCard } from "../UI/ProductCard";
import { Tilt3DCard } from "../UI/Tilt3DCard";
import { useStore } from "../../context/StoreContext";
import { apiClient } from "../../lib/api-client";

interface ProductCatalogViewProps {
  title: string;
  subtitle?: string;
  categoryScope?: string;
  archiveBadge?: string;
  hasDiscount?: boolean;
  defaultSort?: string;
  bannerGradient?: string;
  headerExtra?: React.ReactNode;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface BrandOption {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface FacetAttributeValue {
  id: string;
  value: string;
  label?: string | null;
  colorCode?: string | null;
  count?: number;
}

interface FacetAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: FacetAttributeValue[];
}

function ProductCatalogViewInner({
  title,
  subtitle,
  categoryScope,
  archiveBadge,
  hasDiscount = false,
  defaultSort,
  bannerGradient,
  headerExtra,
}: ProductCatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [, startTransition] = useTransition();

  // Read initial states from URL query parameters
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlCategory =
    searchParams.get("categorySlug") ||
    searchParams.get("category") ||
    (categoryScope ? "" : "All");
  const urlBrands = searchParams.get("brand") ? searchParams.get("brand")!.split(",") : [];
  const urlAttributes = searchParams.get("attributeValues")
    ? searchParams
        .get("attributeValues")!
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  const urlMinPrice = parseInt(searchParams.get("minPrice") || "0", 10);
  const urlMaxPrice = parseInt(searchParams.get("maxPrice") || "500000", 10);
  const urlInStock = searchParams.get("inStock") === "true";
  const urlSort = searchParams.get("sort") || defaultSort || "featured";
  const urlQ = searchParams.get("q") || "";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryScope || urlCategory || "All"
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlBrands);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<string[]>(urlAttributes);
  const [minPrice, setMinPrice] = useState<number>(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState<number>(urlMaxPrice);
  const [inStockOnly, setInStockOnly] = useState<boolean>(urlInStock);
  const [sortBy, setSortBy] = useState<string>(urlSort);
  const [searchQuery, setSearchQuery] = useState<string>(urlQ);
  const [currentPage, setCurrentPage] = useState<number>(urlPage);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Live Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [availableBrands, setAvailableBrands] = useState<BrandOption[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<FacetAttribute[]>([]);

  // Close mobile filter drawer on Escape key
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileFiltersOpen]);

  // Fetch Category Tree and Brands for Filter Facets
  useEffect(() => {
    async function fetchFacets() {
      try {
        const [catsRes, brandsRes, attrsRes] = await Promise.allSettled([
          apiClient.get<any[]>("/categories/tree", { skipAuth: true }),
          apiClient.get<any[]>("/brands/public", { skipAuth: true }),
          apiClient.get<any[]>("/attributes", { skipAuth: true }),
        ]);

        if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value)) {
          const flatCats: CategoryOption[] = [];
          const extractCats = (nodes: any[]) => {
            for (const n of nodes) {
              flatCats.push({ id: n.id, name: n.name, slug: n.slug });
              if (n.children && n.children.length > 0) {
                extractCats(n.children);
              }
            }
          };
          extractCats(catsRes.value);
          setAvailableCategories(flatCats);
        } else {
          setAvailableCategories(
            getAllCategories().map((c) => ({
              id: c.toLowerCase().replace(/\s+/g, "-"),
              name: c,
              slug: c.toLowerCase().replace(/\s+/g, "-"),
            }))
          );
        }

        if (brandsRes.status === "fulfilled" && Array.isArray(brandsRes.value)) {
          setAvailableBrands(
            brandsRes.value.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))
          );
        } else {
          setAvailableBrands(
            getAllBrands().map((b) => ({
              id: b.toLowerCase().replace(/\s+/g, "-"),
              name: b,
              slug: b.toLowerCase().replace(/\s+/g, "-"),
            }))
          );
        }

        if (attrsRes.status === "fulfilled" && Array.isArray(attrsRes.value)) {
          const mappedAttrs: FacetAttribute[] = attrsRes.value.map((a: any) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            type: a.type || "TEXT",
            values: Array.isArray(a.values)
              ? a.values.map((v: any) => ({
                  id: v.id,
                  value: v.value,
                  label: v.label || v.value,
                  colorCode: v.colorCode || null,
                }))
              : [],
          }));
          setAvailableAttributes((prev) => (prev.length > 0 ? prev : mappedAttrs));
        }
      } catch {
        setAvailableCategories(
          getAllCategories().map((c) => ({
            id: c.toLowerCase().replace(/\s+/g, "-"),
            name: c,
            slug: c.toLowerCase().replace(/\s+/g, "-"),
          }))
        );
        setAvailableBrands(
          getAllBrands().map((b) => ({
            id: b.toLowerCase().replace(/\s+/g, "-"),
            name: b,
            slug: b.toLowerCase().replace(/\s+/g, "-"),
          }))
        );
      }
    }

    void fetchFacets();
  }, []);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "" || val === undefined) {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${current.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch Products from Backend API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "12");

      if (categoryScope) {
        params.set("categorySlug", categoryScope);
      } else if (selectedCategory && selectedCategory !== "All") {
        const found = availableCategories.find(
          (c) =>
            c.name.toLowerCase() === selectedCategory.toLowerCase() ||
            c.slug === selectedCategory
        );
        params.set(
          "categorySlug",
          found ? found.slug : selectedCategory.toLowerCase().replace(/\s+/g, "-")
        );
      }

      if (selectedBrands.length > 0) {
        params.set("brandSlug", selectedBrands.join(","));
      }

      if (selectedAttributeValues.length > 0) {
        params.set("attributeValues", selectedAttributeValues.join(","));
      }

      if (minPrice > 0) {
        params.set("minPrice", minPrice.toString());
      }
      if (maxPrice < 500000) {
        params.set("maxPrice", maxPrice.toString());
      }
      if (inStockOnly) {
        params.set("inStock", "true");
      }
      if (hasDiscount) {
        params.set("hasDiscount", "true");
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      if (sortBy === "price-low") params.set("sortBy", "price_asc");
      else if (sortBy === "price-high") params.set("sortBy", "price_desc");
      else if (sortBy === "rating") params.set("sortBy", "rating");
      else if (sortBy === "newest") params.set("sortBy", "newest");
      else params.set("sortBy", "featured");

      const res = await apiClient.get<any>(`/products?${params.toString()}`, {
        skipAuth: true,
      });

      if (res && Array.isArray(res.items)) {
        const mapped: Product[] = res.items.map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          category: item.category?.name || "General",
          brand: item.brand?.name || undefined,
          price: item.salePrice ? Number(item.salePrice) : Number(item.regularPrice),
          regularPrice: Number(item.regularPrice),
          discountPercent: item.discountPercent || undefined,
          rating: Number(item.rating) || 0,
          reviewsCount: Number(item.reviewsCount) || 0,
          image: item.primaryImage?.imageUrl || "/placeholder.png",
          description: item.shortDescription || undefined,
          inStock: item.inStock,
          isFeatured: item.isFeatured,
          badge: item.isFeatured ? "Featured" : undefined,
        }));
        setProducts(mapped);
        setTotalProducts(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (
          res.facets?.attributes &&
          Array.isArray(res.facets.attributes) &&
          res.facets.attributes.length > 0
        ) {
          setAvailableAttributes(res.facets.attributes);
        }
      }
    } catch {
      const fallback = ALL_PRODUCTS.filter((p) => {
        if (
          categoryScope &&
          p.category.toLowerCase().replace(/\s+/g, "-") !== categoryScope.toLowerCase() &&
          p.category.toLowerCase() !== categoryScope.toLowerCase()
        ) {
          return false;
        }
        if (
          !categoryScope &&
          selectedCategory !== "All" &&
          p.category.toLowerCase().replace(/\s+/g, "-") !== selectedCategory.toLowerCase() &&
          p.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
        if (
          selectedBrands.length > 0 &&
          (!p.brand ||
            !selectedBrands.some(
              (b) => b.toLowerCase() === p.brand!.toLowerCase()
            ))
        ) {
          return false;
        }
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (inStockOnly && p.inStock === false) return false;
        if (hasDiscount && (!p.discountPercent || p.discountPercent <= 0)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (
            !p.title.toLowerCase().includes(q) &&
            !p.category.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });

      if (sortBy === "price-low") fallback.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-high") fallback.sort((a, b) => b.price - a.price);
      else if (sortBy === "rating") fallback.sort((a, b) => b.rating - a.rating);

      setProducts(fallback.slice((currentPage - 1) * 12, currentPage * 12));
      setTotalProducts(fallback.length);
      setTotalPages(Math.ceil(fallback.length / 12) || 1);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    categoryScope,
    selectedCategory,
    selectedBrands,
    selectedAttributeValues,
    minPrice,
    maxPrice,
    inStockOnly,
    hasDiscount,
    searchQuery,
    sortBy,
    availableCategories,
  ]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleToggleBrand = (brandSlug: string) => {
    const updated = selectedBrands.includes(brandSlug)
      ? selectedBrands.filter((b) => b !== brandSlug)
      : [...selectedBrands, brandSlug];
    setSelectedBrands(updated);
    setCurrentPage(1);
    updateUrlParams({ brand: updated.length > 0 ? updated.join(",") : null, page: "1" });
  };

  const handleToggleAttributeValue = (val: string) => {
    const updated = selectedAttributeValues.includes(val)
      ? selectedAttributeValues.filter((v) => v !== val)
      : [...selectedAttributeValues, val];
    setSelectedAttributeValues(updated);
    setCurrentPage(1);
    updateUrlParams({
      attributeValues: updated.length > 0 ? updated.join(",") : null,
      page: "1",
    });
  };

  const handleClearAttribute = (attributeValuesInThisAttr: string[]) => {
    const updated = selectedAttributeValues.filter(
      (v) => !attributeValuesInThisAttr.includes(v)
    );
    setSelectedAttributeValues(updated);
    setCurrentPage(1);
    updateUrlParams({
      attributeValues: updated.length > 0 ? updated.join(",") : null,
      page: "1",
    });
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentPage(1);
    updateUrlParams({ categorySlug: catName === "All" ? null : catName, page: "1" });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    updateUrlParams({ sort: newSort, page: "1" });
  };

  const handleResetFilters = () => {
    setSelectedCategory(categoryScope || "All");
    setSelectedBrands([]);
    setSelectedAttributeValues([]);
    setMinPrice(0);
    setMaxPrice(500000);
    setInStockOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
    setSortBy("featured");
    updateUrlParams({
      categorySlug: null,
      brand: null,
      attributeValues: null,
      minPrice: null,
      maxPrice: null,
      inStock: null,
      q: null,
      sort: null,
      page: "1",
    });
  };

  const activeFiltersCount =
    (selectedCategory !== "All" && !categoryScope ? 1 : 0) +
    selectedBrands.length +
    selectedAttributeValues.length +
    (minPrice > 0 || maxPrice < 500000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Breadcrumb Bar */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-5"
      >
        <Link
          href="/"
          className="hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:underline"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        {categoryScope ? (
          <>
            <Link
              href="/shop"
              className="hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Shop
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-bold" aria-current="page">
              {title}
            </span>
          </>
        ) : (
          <span className="text-slate-900 font-bold" aria-current="page">
            {title}
          </span>
        )}
      </nav>

      {/* 1. 3D Spatial Catalog Hero Banner */}
      <div
        className={`${
          bannerGradient
            ? `bg-gradient-to-r ${bannerGradient} shadow-xl border border-white/10`
            : "surface-3d-dark"
        } bg-tech-grid rounded-3xl p-6 sm:p-9 lg:p-10 text-white mb-6 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6`}
      >
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-12 -bottom-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/15 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
            <span>
              {archiveBadge ||
                (categoryScope ? "Authorized Department" : "Official Storefront Catalog")}
            </span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            {title}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            {subtitle ||
              "Explore genuine tech gadgets, computer components, laptops, and electronics with official warranty and instant doorstep delivery across Bangladesh."}
          </p>
        </div>

        {headerExtra ? (
          <div className="relative z-10 shrink-0 w-full lg:w-auto">{headerExtra}</div>
        ) : (
          <div className="relative z-10 shrink-0 w-full sm:w-auto">
            <Tilt3DCard maxTilt={6} scale={1.015}>
              <div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex sm:flex-col justify-between gap-4 min-w-[230px]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 block">
                    Live Inventory
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5">
                    {isLoading ? "…" : totalProducts}
                    <span className="text-xs font-bold text-slate-300 ml-1.5">Items</span>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Official Brand Warranty</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Truck className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>Express 64-District Dispatch</span>
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          </div>
        )}
      </div>

      {/* Quick Department Pill Strip (Unscoped Shop View) */}
      {!categoryScope && availableCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-7 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectCategory("All")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-[background-color,color,border-color,box-shadow] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              selectedCategory === "All"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200/90 hover:border-blue-300 hover:text-slate-900"
            }`}
          >
            All Departments
          </button>
          {availableCategories.slice(0, 10).map((cat) => {
            const isSelected =
              selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
              selectedCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={`pill-${cat.id || cat.slug}`}
                type="button"
                onClick={() => handleSelectCategory(cat.slug)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-[background-color,color,border-color,box-shadow] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200/90 hover:border-blue-300 hover:text-slate-900"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Main Content Grid (Left Sticky 3D Filter Sidebar + Right Products Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-28 surface-3d rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Refine Catalog
              </h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search within results */}
          <div>
            <label
              htmlFor="catalog-search-input"
              className="text-xs font-extrabold uppercase text-slate-700 block mb-2"
            >
              Keyword Filter
            </label>
            <div className="relative">
              <input
                id="catalog-search-input"
                name="search"
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    updateUrlParams({ q: searchQuery.trim() || null, page: "1" });
                  }
                }}
                placeholder="Model, chip, spec…"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Category Tree (Only when not scoped) */}
          {!categoryScope && (
            <div>
              <span className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
                Departments
              </span>
              <div className="space-y-1 max-h-56 overflow-y-auto overscroll-contain pr-1">
                <button
                  type="button"
                  onClick={() => handleSelectCategory("All")}
                  className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    selectedCategory === "All"
                      ? "bg-blue-50 text-blue-700 font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {availableCategories.map((cat) => {
                  const isSelected =
                    selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                    selectedCategory.toLowerCase() === cat.slug.toLowerCase();
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-extrabold"
                          : "text-slate-600 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brands Filter */}
          <div>
            <span className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
              Official Brands
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1">
              {availableBrands.map((brand) => {
                const brandIdOrSlug = brand.slug || brand.name;
                const isChecked = selectedBrands.includes(brandIdOrSlug);
                return (
                  <label
                    key={brand.id || brand.slug}
                    className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 cursor-pointer select-none py-1 px-1 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        name={`brand-${brandIdOrSlug}`}
                        checked={isChecked}
                        onChange={() => handleToggleBrand(brandIdOrSlug)}
                        className="rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-semibold">{brand.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dynamic Attributes Filter */}
          {availableAttributes.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              {availableAttributes.map((attr) => {
                const valuesInThisAttr = attr.values.map((v) => v.value);
                const hasActiveSelection = valuesInThisAttr.some((v) =>
                  selectedAttributeValues.includes(v)
                );

                return (
                  <div key={attr.id || attr.slug}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                        {attr.name}
                      </span>
                      {hasActiveSelection && (
                        <button
                          type="button"
                          onClick={() => handleClearAttribute(valuesInThisAttr)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {attr.type === "COLOR" ? (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((val) => {
                          const isChecked = selectedAttributeValues.includes(val.value);
                          const colorHex = val.colorCode || "#94a3b8";
                          const isDark =
                            colorHex.toLowerCase() === "#000000" ||
                            colorHex.toLowerCase() === "#1e293b" ||
                            colorHex.toLowerCase().startsWith("#0") ||
                            colorHex.toLowerCase().startsWith("#1");

                          return (
                            <button
                              key={val.id || val.value}
                              type="button"
                              aria-pressed={isChecked}
                              onClick={() => handleToggleAttributeValue(val.value)}
                              aria-label={`Filter by ${attr.name}: ${val.label || val.value}`}
                              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-[border-color,background-color,box-shadow] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                isChecked
                                  ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: colorHex }}
                              >
                                {isChecked && (
                                  <Check
                                    className={`w-2.5 h-2.5 ${
                                      isDark ? "text-white" : "text-slate-900"
                                    }`}
                                    strokeWidth={3}
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                              <span className="capitalize">{val.label || val.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : attr.type === "BUTTON" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values.map((val) => {
                          const isChecked = selectedAttributeValues.includes(val.value);

                          return (
                            <button
                              key={val.id || val.value}
                              type="button"
                              aria-pressed={isChecked}
                              onClick={() => handleToggleAttributeValue(val.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-[border-color,background-color,color] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                isChecked
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <span>{val.label || val.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto overscroll-contain pr-1">
                        {attr.values.map((val) => {
                          const isChecked = selectedAttributeValues.includes(val.value);

                          return (
                            <label
                              key={val.id || val.value}
                              className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 cursor-pointer select-none py-0.5"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleAttributeValue(val.value)}
                                  className="rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="font-semibold">{val.label || val.value}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="catalog-price-range"
                className="text-xs font-extrabold uppercase text-slate-700"
              >
                Budget Ceiling
              </label>
              <span className="text-[11px] font-black text-blue-700 tabular-nums">
                {formatBDT(minPrice)} – {formatBDT(maxPrice)}
              </span>
            </div>
            <input
              id="catalog-price-range"
              name="maxPrice"
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={maxPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(val);
                setCurrentPage(1);
                updateUrlParams({ maxPrice: val < 500000 ? val.toString() : null, page: "1" });
              }}
              className="w-full accent-blue-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 tabular-nums">
              <span>৳0</span>
              <span>৳2,50,000</span>
              <span>৳5,00,000+</span>
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label
              htmlFor="catalog-instock-toggle"
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <input
                id="catalog-instock-toggle"
                name="inStock"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setInStockOnly(checked);
                  setCurrentPage(1);
                  updateUrlParams({ inStock: checked ? "true" : null, page: "1" });
                }}
                className="rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Ready to Ship Only</span>
            </label>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="lg:col-span-9">
          {/* Top Sort & View Control Bar */}
          <div className="surface-3d rounded-2xl p-3.5 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-extrabold border border-blue-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Filter className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Filters{" "}
                  {activeFiltersCount > 0 ? (
                    <span className="tabular-nums">({activeFiltersCount})</span>
                  ) : (
                    ""
                  )}
                </span>
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Showing{" "}
                <strong className="text-slate-900 font-black tabular-nums">
                  {products.length}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-900 font-black tabular-nums">
                  {totalProducts}
                </strong>{" "}
                items
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="catalog-sort-select"
                  className="text-xs font-bold text-slate-400 hidden sm:inline"
                >
                  Sort by:
                </label>
                <select
                  id="catalog-sort-select"
                  name="sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <option value="featured">Featured &amp; Popular</option>
                  <option value="newest">Newest Releases</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>

              {/* View Mode Switcher */}
              <div
                role="group"
                aria-label="Product layout mode"
                className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    viewMode === "grid"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  aria-label="Grid layout"
                >
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "list"}
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    viewMode === "list"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  aria-label="Horizontal list layout"
                >
                  <List className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-400 mr-1">Active:</span>

              {selectedCategory !== "All" && !categoryScope && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200/90">
                  <span>Dept: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("All")}
                    className="hover:text-blue-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label={`Remove category filter: ${selectedCategory}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              {selectedBrands.map((b) => {
                const brandObj = availableBrands.find(
                  (brand) =>
                    brand.slug.toLowerCase() === b.toLowerCase() ||
                    brand.name.toLowerCase() === b.toLowerCase()
                );
                const brandDisplayName = brandObj
                  ? brandObj.name
                  : b.charAt(0).toUpperCase() + b.slice(1);

                return (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200/90"
                  >
                    <span>Brand: {brandDisplayName}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBrand(b)}
                      className="hover:text-blue-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      aria-label={`Remove brand filter: ${brandDisplayName}`}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                );
              })}

              {selectedAttributeValues.map((val) => {
                let attrLabel = val;
                let attrName = "";
                for (const a of availableAttributes) {
                  const matchedVal = a.values.find(
                    (v) => v.value === val || v.id === val
                  );
                  if (matchedVal) {
                    attrName = a.name;
                    attrLabel = matchedVal.label || matchedVal.value;
                    break;
                  }
                }

                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200/90"
                  >
                    <span>
                      {attrName ? `${attrName}: ` : ""}
                      {attrLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAttributeValue(val)}
                      className="hover:text-indigo-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      aria-label={`Remove filter: ${attrLabel}`}
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </span>
                );
              })}

              {maxPrice < 500000 && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                  <span className="tabular-nums">Max: {formatBDT(maxPrice)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMaxPrice(500000);
                      updateUrlParams({ maxPrice: null, page: "1" });
                    }}
                    className="hover:text-slate-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                    aria-label="Remove maximum price filter"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  <span>In Stock Only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInStockOnly(false);
                      updateUrlParams({ inStock: null, page: "1" });
                    }}
                    className="hover:text-emerald-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label="Remove in-stock filter"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                  <span>&ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      updateUrlParams({ q: null, page: "1" });
                    }}
                    className="hover:text-amber-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                    aria-label={`Clear search query: ${searchQuery}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded px-1.5 py-0.5"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Results Area */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="surface-3d rounded-2xl p-4 animate-pulse space-y-3"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-xl" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-5 bg-slate-100 rounded w-1/2 pt-2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      isWishlisted={wishlistIds.has(product.id)}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                /* Sleek Horizontal 3D List View */
                <div className="space-y-4">
                  {products.map((product) => {
                    const isWishlisted = wishlistIds.has(product.id);
                    const outOfStock = product.inStock === false;
                    return (
                      <div
                        key={product.id}
                        className="surface-3d rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 hover:border-blue-300 transition-[border-color,box-shadow] group"
                      >
                        <Link
                          href={`/products/${product.slug || product.id}`}
                          className="relative w-full sm:w-36 h-40 sm:h-36 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 144px"
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <span className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md tabular-nums">
                              -{product.discountPercent}%
                            </span>
                          ) : null}
                        </Link>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                              {product.category}
                            </span>
                            {product.brand && (
                              <span className="text-[10px] font-bold text-slate-500">
                                {product.brand}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 tabular-nums">
                              <Star
                                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                                aria-hidden="true"
                              />
                              <span>{product.rating.toFixed(1)}</span>
                            </span>
                          </div>

                          <Link
                            href={`/products/${product.slug || product.id}`}
                            className="text-base sm:text-lg font-black text-slate-900 hover:text-blue-700 transition-colors block line-clamp-2 focus-visible:outline-none focus-visible:underline"
                          >
                            {product.title}
                          </Link>

                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
                            <span
                              className={
                                outOfStock ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"
                              }
                            >
                              {outOfStock ? "Out of Stock" : "● Official Stock Available"}
                            </span>
                            <span>•</span>
                            <span>1-Year Brand Warranty</span>
                          </div>
                        </div>

                        <div className="w-full sm:w-48 sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <div>
                            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                              {formatBDT(product.price)}
                            </div>
                            {product.regularPrice && product.regularPrice > product.price && (
                              <div className="text-xs text-slate-400 line-through tabular-nums">
                                {formatBDT(product.regularPrice)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-pressed={isWishlisted}
                              aria-label={
                                isWishlisted
                                  ? `Remove ${product.title} from wishlist`
                                  : `Save ${product.title} to wishlist`
                              }
                              onClick={() => toggleWishlist(product.id)}
                              className={`p-2.5 rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                isWishlisted
                                  ? "bg-rose-50 border-rose-200 text-rose-600"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600"
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`}
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => addToCart(product)}
                              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav
                  aria-label="Catalog pagination"
                  className="mt-10 flex items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                      updateUrlParams({ page: newPage.toString() });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          updateUrlParams({ page: pageNum.toString() });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-9 h-9 rounded-xl text-xs font-black cursor-pointer transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          isActive
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const newPage = Math.min(totalPages, currentPage + 1);
                      setCurrentPage(newPage);
                      updateUrlParams({ page: newPage.toString() });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="surface-3d rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">
                No matching products found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
                We couldn&apos;t find any items matching your active filters. Try raising the budget ceiling or clearing brand selections.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xl transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-Over Dialog */}
      {isMobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 p-6 overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-700" aria-hidden="true" />
                <h3 className="text-base font-black text-slate-900">Filter Catalog</h3>
              </div>
              <button
                type="button"
                aria-label="Close filter drawer"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {!categoryScope && (
                <div>
                  <span className="text-xs font-black uppercase text-slate-700 block mb-2">
                    Categories
                  </span>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory("All")}
                      className={`w-full text-left text-xs py-2 px-2.5 rounded-xl font-bold transition-colors ${
                        selectedCategory === "All"
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600"
                      }`}
                    >
                      All Categories
                    </button>
                    {availableCategories.map((c) => (
                      <button
                        key={c.id || c.slug}
                        type="button"
                        onClick={() => handleSelectCategory(c.slug)}
                        className={`w-full text-left text-xs py-2 px-2.5 rounded-xl font-bold transition-colors ${
                          selectedCategory.toLowerCase() === c.slug.toLowerCase()
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-black uppercase text-slate-700 block mb-2">
                  Brands
                </span>
                <div className="space-y-1.5">
                  {availableBrands.map((b) => {
                    const brandSlug = b.slug || b.name;
                    return (
                      <label
                        key={b.id || b.slug}
                        className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brandSlug)}
                          onChange={() => handleToggleBrand(brandSlug)}
                          className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                        />
                        <span>{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {availableAttributes.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {availableAttributes.map((attr) => {
                    const valuesInThisAttr = attr.values.map((v) => v.value);
                    const hasActiveSelection = valuesInThisAttr.some((v) =>
                      selectedAttributeValues.includes(v)
                    );

                    return (
                      <div key={`m-${attr.id || attr.slug}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                            {attr.name}
                          </span>
                          {hasActiveSelection && (
                            <button
                              type="button"
                              onClick={() => handleClearAttribute(valuesInThisAttr)}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {attr.type === "COLOR" ? (
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map((val) => {
                              const isChecked = selectedAttributeValues.includes(val.value);
                              const colorHex = val.colorCode || "#94a3b8";
                              const isDark =
                                colorHex.toLowerCase() === "#000000" ||
                                colorHex.toLowerCase() === "#1e293b" ||
                                colorHex.toLowerCase().startsWith("#0") ||
                                colorHex.toLowerCase().startsWith("#1");

                              return (
                                <button
                                  key={`m-${val.id || val.value}`}
                                  type="button"
                                  aria-pressed={isChecked}
                                  onClick={() => handleToggleAttributeValue(val.value)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                                    isChecked
                                      ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs"
                                      : "border-slate-200 bg-white text-slate-700"
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                                    style={{ backgroundColor: colorHex }}
                                  >
                                    {isChecked && (
                                      <Check
                                        className={`w-2.5 h-2.5 ${
                                          isDark ? "text-white" : "text-slate-900"
                                        }`}
                                        strokeWidth={3}
                                        aria-hidden="true"
                                      />
                                    )}
                                  </span>
                                  <span className="capitalize">{val.label || val.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : attr.type === "BUTTON" ? (
                          <div className="flex flex-wrap gap-1.5">
                            {attr.values.map((val) => {
                              const isChecked = selectedAttributeValues.includes(val.value);
                              return (
                                <button
                                  key={`m-${val.id || val.value}`}
                                  type="button"
                                  aria-pressed={isChecked}
                                  onClick={() => handleToggleAttributeValue(val.value)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    isChecked
                                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <span>{val.label || val.value}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto overscroll-contain">
                            {attr.values.map((val) => {
                              const isChecked = selectedAttributeValues.includes(val.value);
                              return (
                                <label
                                  key={`m-${val.id || val.value}`}
                                  className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleAttributeValue(val.value)}
                                    className="rounded border-slate-300 text-blue-600 w-3.5 h-3.5"
                                  />
                                  <span>{val.label || val.value}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label
                  htmlFor="mobile-catalog-price-range"
                  className="text-xs font-black uppercase text-slate-700 block mb-2 tabular-nums"
                >
                  Max Budget: {formatBDT(maxPrice)}
                </label>
                <input
                  id="mobile-catalog-price-range"
                  name="mobileMaxPrice"
                  type="range"
                  min="0"
                  max="500000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPrice(val);
                    setCurrentPage(1);
                    updateUrlParams({ maxPrice: val < 500000 ? val.toString() : null, page: "1" });
                  }}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label
                  htmlFor="mobile-catalog-instock"
                  className="flex items-center gap-2.5 text-xs font-bold text-slate-700"
                >
                  <input
                    id="mobile-catalog-instock"
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setInStockOnly(checked);
                      setCurrentPage(1);
                      updateUrlParams({ inStock: checked ? "true" : null, page: "1" });
                    }}
                    className="rounded border-slate-300 text-blue-600 w-4 h-4"
                  />
                  <span>Ready to Ship Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-sm transition-colors cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Show ({totalProducts})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCatalogView(props: ProductCatalogViewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {props.title}
              </h1>
              {props.subtitle && (
                <p className="mt-2 text-sm text-slate-500 max-w-2xl">{props.subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="h-96 surface-3d rounded-3xl animate-pulse hidden md:block" />
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 surface-3d rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProductCatalogViewInner {...props} />
    </Suspense>
  );
}
