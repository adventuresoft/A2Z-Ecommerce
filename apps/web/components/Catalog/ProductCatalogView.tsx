"use client";

import React, { useState, useEffect, useTransition, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  ChevronDown,
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
  Loader2,
} from "lucide-react";
import {
  Product,
  formatBDT,
  ALL_PRODUCTS,
  getAllCategories,
  getAllBrands,
} from "../../data/mock-catalog";
import { ProductCard } from "../UI/ProductCard";
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
  const [isPending, startTransition] = useTransition();

  // Read initial states from URL query parameters
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlCategory = searchParams.get("categorySlug") || searchParams.get("category") || (categoryScope ? "" : "All");
  const urlBrands = searchParams.get("brand") ? searchParams.get("brand")!.split(",") : [];
  const urlAttributes = searchParams.get("attributeValues")
    ? searchParams.get("attributeValues")!.split(",").map((v) => v.trim()).filter(Boolean)
    : [];
  const urlMinPrice = parseInt(searchParams.get("minPrice") || "0", 10);
  const urlMaxPrice = parseInt(searchParams.get("maxPrice") || "500000", 10);
  const urlInStock = searchParams.get("inStock") === "true";
  const urlSort = searchParams.get("sort") || defaultSort || "featured";
  const urlQ = searchParams.get("q") || "";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryScope || urlCategory || "All");
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
        // Fallback to fixture categories/brands
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

    fetchFacets();
  }, []);

  // Update URL Query params
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
          (c) => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.slug === selectedCategory
        );
        params.set("categorySlug", found ? found.slug : selectedCategory.toLowerCase().replace(/\s+/g, "-"));
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

      // Map frontend sort values to backend sortBy
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
      // Fallback to local mock products if API is unreachable
      let fallback = ALL_PRODUCTS.filter((p) => {
        if (categoryScope && p.category.toLowerCase() !== categoryScope.toLowerCase()) return false;
        if (!categoryScope && selectedCategory !== "All" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        if (selectedBrands.length > 0 && (!p.brand || !selectedBrands.includes(p.brand))) return false;
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (inStockOnly && p.inStock === false) return false;
        if (hasDiscount && (!p.discountPercent || p.discountPercent <= 0)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
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
    fetchProducts();
  }, [fetchProducts]);

  // Toggle brand checkbox
  const handleToggleBrand = (brandSlug: string) => {
    const updated = selectedBrands.includes(brandSlug)
      ? selectedBrands.filter((b) => b !== brandSlug)
      : [...selectedBrands, brandSlug];
    setSelectedBrands(updated);
    setCurrentPage(1);
    updateUrlParams({ brand: updated.length > 0 ? updated.join(",") : null, page: "1" });
  };

  // Toggle attribute value checkbox/swatch/pill
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

  // Clear single attribute group
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

  // Change Category
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentPage(1);
    updateUrlParams({ categorySlug: catName === "All" ? null : catName, page: "1" });
  };

  // Change Sort
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    updateUrlParams({ sort: newSort, page: "1" });
  };

  // Reset all filters
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

  // Active filters count
  const activeFiltersCount =
    (selectedCategory !== "All" && !categoryScope ? 1 : 0) +
    selectedBrands.length +
    selectedAttributeValues.length +
    (minPrice > 0 || maxPrice < 500000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Header Banner */}
      <div
        className={`bg-gradient-to-r ${
          bannerGradient || "from-blue-900 via-slate-900 to-indigo-950"
        } rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6`}
      >
        <div className="relative z-10 max-w-2xl">
          {archiveBadge && (
            <span className="inline-flex items-center space-x-1.5 bg-white/10 text-white text-xs font-black uppercase px-3 py-1 rounded-full border border-white/20 mb-3 backdrop-blur-xs shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{archiveBadge}</span>
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            {title}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            {subtitle ||
              "Explore genuine tech gadgets, computer components, laptops, and electronics with official warranty and instant doorstep delivery across Bangladesh."}
          </p>
        </div>

        {headerExtra && (
          <div className="relative z-10 shrink-0 w-full lg:w-auto">
            {headerExtra}
          </div>
        )}

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Main Content Grid (Left Sticky Filter Sidebar + Right Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Filter Sidebar (Left Column) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Filters
              </h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Search within results */}
          <div>
            <label htmlFor="catalog-search-input" className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
              Search Products
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
                placeholder="e.g. Model, keyword, specs…"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" aria-hidden="true" />
            </div>
          </div>

          {/* Category Tree (Only when not scoped) */}
          {!categoryScope && (
            <div>
              <label className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
                Categories
              </label>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => handleSelectCategory("All")}
                  className={`w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
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
                      className={`w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-extrabold"
                          : "text-slate-600 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brands Filter */}
          <div>
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
              Brands
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {availableBrands.map((brand) => {
                const brandIdOrSlug = brand.slug || brand.name;
                const isChecked = selectedBrands.includes(brandIdOrSlug);
                return (
                  <label
                    key={brand.id || brand.slug}
                    className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 cursor-pointer select-none py-0.5"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBrand(brandIdOrSlug)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-semibold">{brand.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dynamic Attributes Filter (Color, Size, RAM, etc.) */}
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
                      <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                        {attr.name}
                      </label>
                      {hasActiveSelection && (
                        <button
                          type="button"
                          onClick={() => handleClearAttribute(valuesInThisAttr)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {attr.type === "COLOR" ? (
                      /* Color Swatches */
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
                              onClick={() => handleToggleAttributeValue(val.value)}
                              title={val.label || val.value}
                              aria-label={`Filter by ${attr.name}: ${val.label || val.value}`}
                              className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isChecked
                                  ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-2 ring-blue-600/20"
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
                                  />
                                )}
                              </span>
                              <span className="capitalize">{val.label || val.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : attr.type === "BUTTON" ? (
                      /* Button Pills (Size, Specs, etc.) */
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values.map((val) => {
                          const isChecked = selectedAttributeValues.includes(val.value);

                          return (
                            <button
                              key={val.id || val.value}
                              type="button"
                              onClick={() => handleToggleAttributeValue(val.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
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
                      /* Text Checkboxes */
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {attr.values.map((val) => {
                          const isChecked = selectedAttributeValues.includes(val.value);

                          return (
                            <label
                              key={val.id || val.value}
                              className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 cursor-pointer select-none py-0.5"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleAttributeValue(val.value)}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
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
              <label className="text-xs font-extrabold uppercase text-slate-700">
                Price Range
              </label>
              <span className="text-[11px] font-bold text-blue-700">
                {formatBDT(minPrice)} - {formatBDT(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={maxPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(val);
                updateUrlParams({ maxPrice: val < 500000 ? val.toString() : null, page: "1" });
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>৳0</span>
              <span>৳2,50,000</span>
              <span>৳5,00,000+</span>
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setInStockOnly(checked);
                  setCurrentPage(1);
                  updateUrlParams({ inStock: checked ? "true" : null, page: "1" });
                }}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                In Stock Items Only
              </span>
            </label>
          </div>
        </aside>

        {/* Right Main Content Area (Products Grid) */}
        <div className="lg:col-span-9">
          {/* Top Sort & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Showing <strong className="text-slate-900">{products.length}</strong> of{" "}
                <strong className="text-slate-900">{totalProducts}</strong> products
              </span>
            </div>

            <div className="flex items-center space-x-3 ml-auto">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="featured">Featured & Popular</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>

              {/* View Mode Grid/List */}
              <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-400"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-400"
                  }`}
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges / Tags */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-400 mr-1">Active Filters:</span>

              {selectedCategory !== "All" && !categoryScope && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200/90 shadow-2xs">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("All")}
                    className="hover:text-blue-900 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
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
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200/90 shadow-2xs hover:bg-blue-100/70 transition-colors"
                  >
                    <span>Brand: {brandDisplayName}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleBrand(b)}
                      className="hover:text-blue-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
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
                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200/90 shadow-2xs hover:bg-indigo-100/70 transition-colors"
                  >
                    <span>{attrName ? `${attrName}: ` : ""}{attrLabel}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAttributeValue(val)}
                      className="hover:text-indigo-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
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
                    className="hover:text-slate-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-600"
                    aria-label="Remove maximum price filter"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  <span>In Stock Only</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInStockOnly(false);
                      updateUrlParams({ inStock: null, page: "1" });
                    }}
                    className="hover:text-emerald-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                    aria-label="Remove in-stock filter"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      updateUrlParams({ q: null, page: "1" });
                    }}
                    className="hover:text-amber-950 cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-600"
                    aria-label={`Clear search query: ${searchQuery}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 rounded px-1.5 py-0.5"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs animate-pulse space-y-3"
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
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-4"
                }
              >
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                      updateUrlParams({ page: newPage.toString() });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          updateUrlParams({ page: pageNum.toString() });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-9 h-9 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-700 text-white shadow-xs"
                            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
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
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                We couldn&apos;t find any items matching your current filters. Try relaxing the
                price range or removing active brand filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-Up Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-black text-slate-900">Filter Products</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filters Body */}
            <div className="space-y-6 flex-1">
              {!categoryScope && (
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-2">
                    Categories
                  </label>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory("All")}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-bold ${
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
                        className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-bold ${
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

              {/* Brands */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-2">
                  Brands
                </label>
                <div className="space-y-1.5">
                  {availableBrands.map((b) => {
                    const brandSlug = b.slug || b.name;
                    return (
                      <label
                        key={b.id || b.slug}
                        className="flex items-center space-x-2 text-xs font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brandSlug)}
                          onChange={() => handleToggleBrand(brandSlug)}
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <span>{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Attributes Filter (Mobile) */}
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
                          <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                            {attr.name}
                          </label>
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
                                  onClick={() => handleToggleAttributeValue(val.value)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                    isChecked
                                      ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-2 ring-blue-600/20"
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
                                  onClick={() => handleToggleAttributeValue(val.value)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
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
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {attr.values.map((val) => {
                              const isChecked = selectedAttributeValues.includes(val.value);
                              return (
                                <label
                                  key={`m-${val.id || val.value}`}
                                  className="flex items-center space-x-2 text-xs font-semibold text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleAttributeValue(val.value)}
                                    className="rounded text-blue-600 w-3.5 h-3.5"
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

              {/* Price */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-2">
                  Max Price: {formatBDT(maxPrice)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Mobile Footer Apply */}
            <div className="pt-4 border-t border-slate-200 mt-6 flex space-x-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-slate-100 font-bold text-xs text-slate-700 rounded-xl cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Apply ({totalProducts})
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
              <div className="h-96 bg-white rounded-2xl border border-slate-200/80 animate-pulse hidden md:block" />
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
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

