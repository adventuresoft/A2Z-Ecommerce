"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Grid,
  List,
  Star,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Filter,
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

interface ProductCatalogViewProps {
  title: string;
  subtitle?: string;
  categoryScope?: string;
  archiveBadge?: string;
}

export function ProductCatalogView({
  title,
  subtitle,
  categoryScope,
  archiveBadge,
}: ProductCatalogViewProps) {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();

  const allCategories = getAllCategories();
  const allBrands = getAllBrands();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryScope || "All");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Toggle brand checkbox
  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(categoryScope || "All");
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(500000);
    setInStockOnly(false);
    setMinRating(0);
    setSearchQuery("");
  };

  // Active filters count
  const activeFiltersCount =
    (selectedCategory !== "All" && !categoryScope ? 1 : 0) +
    selectedBrands.length +
    (minPrice > 0 || maxPrice < 500000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      // Category filter
      if (categoryScope && product.category.toLowerCase() !== categoryScope.toLowerCase()) {
        return false;
      }
      if (
        !categoryScope &&
        selectedCategory !== "All" &&
        product.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && (!product.brand || !selectedBrands.includes(product.brand))) {
        return false;
      }

      // Price filter
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }

      // In-stock filter
      if (inStockOnly && product.inStock === false) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesBrand) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "discount") return (b.discountPercent || 0) - (a.discountPercent || 0);
      return 0; // default featured
    });
  }, [
    selectedCategory,
    categoryScope,
    selectedBrands,
    minPrice,
    maxPrice,
    inStockOnly,
    minRating,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          {archiveBadge && (
            <span className="inline-flex items-center space-x-1 bg-orange-500/20 text-orange-300 text-xs font-black uppercase px-3 py-1 rounded-full border border-orange-500/30 mb-3">
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
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
              Search Products
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Model, keyword, specs..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Category Tree (Only when not scoped) */}
          {!categoryScope && (
            <div>
              <label className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
                Categories
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === "All"
                      ? "bg-blue-50 text-blue-700 font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] text-slate-400">{ALL_PRODUCTS.length}</span>
                </button>
                {allCategories.map((cat) => {
                  const count = ALL_PRODUCTS.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-extrabold"
                          : "text-slate-600 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] text-slate-400">{count}</span>
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
              {allBrands.map((brand) => {
                const isChecked = selectedBrands.includes(brand);
                const count = ALL_PRODUCTS.filter((p) => p.brand === brand).length;
                return (
                  <label
                    key={brand}
                    className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 cursor-pointer select-none py-0.5"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBrand(brand)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-semibold">{brand}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range in BDT */}
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold uppercase text-slate-700 mb-2">
              <span>Price Range</span>
              <span className="text-blue-700 font-mono text-[11px]">
                {formatBDT(minPrice)} - {formatBDT(maxPrice)}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-mono text-[11px]">
                  Min: {formatBDT(minPrice)}
                </div>
                <span className="text-slate-400">-</span>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-mono text-[11px]">
                  Max: {formatBDT(maxPrice)}
                </div>
              </div>
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>In Stock Only</span>
              </span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Customer Rating Filter */}
          <div className="pt-2 border-t border-slate-200">
            <label className="text-xs font-extrabold uppercase text-slate-700 block mb-2">
              Minimum Rating
            </label>
            <div className="space-y-1">
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                  className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                    minRating === stars
                      ? "bg-amber-50 text-amber-900 font-bold"
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < stars ? "text-amber-400 fill-current" : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="ml-1">& Up</span>
                  </div>
                  {minRating === stars && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Toolbar & Product Grid */}
        <div className="lg:col-span-9">
          {/* Top Toolbar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Results count & Mobile filter button */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> items
              </span>
            </div>

            {/* Right: Sort Dropdown & View Mode Toggle */}
            <div className="flex items-center space-x-3">
              {/* Sort selector */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="featured">Featured & Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>

              {/* View Toggle */}
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

          {/* Active Filter Pills (Tags) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-400 mr-1">Active:</span>

              {selectedCategory !== "All" && !categoryScope && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="ml-1.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200"
                >
                  {b}
                  <button
                    onClick={() => handleToggleBrand(b)}
                    className="ml-1.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {maxPrice < 500000 && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                  Max: {formatBDT(maxPrice)}
                  <button
                    onClick={() => setMaxPrice(500000)}
                    className="ml-1.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                  In Stock Only
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="ml-1.5 hover:text-emerald-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                  &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")} className="ml-1.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products Grid / Empty State */}
          {filteredProducts.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product, idx) => (
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
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filters Body */}
            <div className="space-y-6 flex-1">
              {/* Category */}
              {!categoryScope && (
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-2">
                    Categories
                  </label>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("All")}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-bold ${
                        selectedCategory === "All"
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600"
                      }`}
                    >
                      All Categories
                    </button>
                    {allCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCategory(c)}
                        className={`w-full text-left text-xs py-1.5 px-2 rounded-lg font-bold ${
                          selectedCategory === c
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600"
                        }`}
                      >
                        {c}
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
                  {allBrands.map((b) => (
                    <label
                      key={b}
                      className="flex items-center space-x-2 text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => handleToggleBrand(b)}
                        className="rounded text-blue-600 w-3.5 h-3.5"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

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
                className="flex-1 py-2.5 bg-slate-100 font-bold text-xs text-slate-700 rounded-xl"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
