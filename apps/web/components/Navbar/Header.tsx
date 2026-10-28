"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Heart,
  LayoutDashboard,
  MapPin,
  LogOut,
  Package,
  Loader2,
} from "lucide-react";
import { formatBDT } from "../../data/mock-catalog";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../lib/api-client";
import { fetchCategoryTree } from "../../lib/categories";

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  wishlistCount?: number;
  onOpenMobileMenu?: () => void;
  onOpenCartModal?: () => void;
  onOpenWishlist?: () => void;
}

interface SearchSuggestionProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  image?: string | null;
  category: string;
}

interface SearchSuggestionCategory {
  id: string;
  name: string;
  slug: string;
}

interface SearchSuggestionsResponse {
  products: SearchSuggestionProduct[];
  categories: SearchSuggestionCategory[];
}

export function Header({
  cartCount,
  cartTotal,
  wishlistCount = 0,
  onOpenMobileMenu,
  onOpenCartModal,
  onOpenWishlist,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse>({
    products: [],
    categories: [],
  });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Debounced search suggestions fetch
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions({ products: [], categories: [] });
      setIsLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const data = await apiClient.get<SearchSuggestionsResponse>(
          `/products/search-suggestions?q=${encodeURIComponent(trimmed)}&limit=6`
        );
        if (data) {
          setSuggestions({
            products: data.products || [],
            categories: data.categories || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  const [categoriesList, setCategoriesList] = useState<string[]>([
    "All Categories",
    "Electronics",
    "Fashion & Apparel",
    "Home & Living",
    "Health & Beauty",
    "Sports & Outdoors",
  ]);

  useEffect(() => {
    fetchCategoryTree().then((tree) => {
      if (tree && tree.length > 0) {
        setCategoriesList(["All Categories", ...tree.map((c) => c.name)]);
      }
    });
  }, []);

  // Close search suggestions & account dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsCategoryDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile menu button & Brand Logo Lockup */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 text-slate-700 hover:text-blue-700 rounded-xl hover:bg-slate-100 transition-colors lg:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Official Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-1 group-hover:border-blue-500 group-hover:shadow-md transition-all">
              <Image
                src="/brand/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={44}
                height={44}
                priority
                className="object-contain w-full h-full group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                  A<span className="text-blue-700">to</span>Z
                </span>
                <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200">
                  Ecommerce
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                Trusted Shopping, Always
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar with Category Filter & Live Autocomplete */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative mx-2">
          <div className="w-full flex items-center bg-slate-50/90 rounded-2xl border-2 border-slate-200 focus-within:border-blue-600 focus-within:bg-white transition-all overflow-hidden shadow-2xs">
            {/* Category Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                aria-expanded={isCategoryDropdownOpen}
                aria-label="Select search category filter"
                className="border-r border-slate-200 px-3.5 py-2.5 bg-slate-100/70 hover:bg-slate-100 cursor-pointer flex items-center space-x-1.5 text-xs font-bold text-slate-700 select-none whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span>{selectedCategory}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 transition-colors ${
                        selectedCategory === cat ? "text-blue-700 font-bold bg-blue-50/50" : "text-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Field */}
            <input
              type="search"
              name="search"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search products, brands, models, or categories"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="Search products, brands, models, or categories…"
              className="flex-1 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden bg-transparent"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1.5 text-slate-400 hover:text-slate-600 mr-1.5 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Search Submit Button */}
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 transition-colors flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Autocomplete Dropdown Preview */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Matching suggestions for &quot;{searchQuery}&quot;</span>
                {isLoadingSuggestions ? (
                  <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1" role="status" aria-live="polite">
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    Searching…
                  </span>
                ) : (
                  <span className="text-[11px] text-blue-700 font-bold">Live Catalog Preview</span>
                )}
              </div>

              {/* Matching Categories section */}
              {suggestions.categories.length > 0 && (
                <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Matching Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          router.push(`/category/${cat.slug}`);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products section */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {suggestions.products.length > 0 ? (
                  suggestions.products.map((item) => (
                    <Link
                      key={item.id}
                      href={`/products/${item.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="px-4 py-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition-colors group focus-visible:outline-none focus-visible:bg-blue-50"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {item.image ? (
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">
                            {item.category?.[0] || "P"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-slate-400 truncate block">
                            in {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-black text-orange-600 tabular-nums">
                          {formatBDT(item.price)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </div>
                    </Link>
                  ))
                ) : isLoadingSuggestions ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2" role="status" aria-live="polite">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
                    <span>Searching catalog…</span>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No matching products found. Press Enter to view all results in shop.
                  </div>
                )}
              </div>

              {/* View All Footer */}
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-full px-4 py-2.5 text-center text-xs font-bold text-blue-700 hover:bg-blue-50 bg-slate-50/80 border-t border-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span>View all results for &quot;{searchQuery}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, Account & Cart */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label={`Wishlist, ${wishlistCount} saved items`}
          >
            <div className="relative">
              <Heart className="w-5 h-5" aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden lg:inline">Wishlist</span>
          </button>

          {/* User Account */}
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              aria-expanded={isAccountDropdownOpen}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Account Menu"
            >
              {isAuthenticated && user ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-700 group-hover:border-blue-300 transition-colors">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-semibold leading-tight">
                  {isAuthenticated && user
                    ? `Hello, ${user.name.split(" ")[0]}`
                    : "Hello, Sign In"}
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center leading-tight">
                  My Account
                  <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" aria-hidden="true" />
                </span>
              </div>
            </button>

            {/* Account Dropdown */}
            {isAccountDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <Link
                        href="/account"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Dashboard Overview
                      </Link>
                      <Link
                        href="/account/profile"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Profile & Security
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Saved Addresses
                      </Link>
                      <Link
                        href="/account#orders"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <Package className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Heart className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Wishlist ({wishlistCount})</span>
                      </Link>

                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsAccountDropdownOpen(false);
                            await logout();
                            router.push("/login");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <LogOut className="w-4 h-4 text-red-500" aria-hidden="true" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center space-y-3">
                    <p className="text-xs text-slate-600">
                      Sign in to view your profile and orders
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="block w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Sign In
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      New customer?{" "}
                      <Link
                        href="/register"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="text-blue-600 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                      >
                        Create Account
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon & Total Preview */}
          <button
            type="button"
            onClick={onOpenCartModal}
            className="flex items-center space-x-2.5 sm:space-x-3 px-3 py-2 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Shopping Cart, ${cartCount} items, total ${formatBDT(cartTotal)}`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:text-blue-700 transition-colors" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-2xs tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] text-slate-400 font-semibold leading-none">Cart</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight mt-1 tabular-nums">
                {formatBDT(cartTotal)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
