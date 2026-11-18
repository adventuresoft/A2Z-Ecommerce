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
  MessageSquare,
  Briefcase,
  Check,
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

  // Close search suggestions & account dropdown on click outside or Escape key
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSuggestions(false);
        setIsCategoryDropdownOpen(false);
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile menu button & Brand Logo Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-colors lg:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Official Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl py-1 pr-1"
          >
            <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 group-hover:border-blue-300 transition-colors">
              <Image
                src="/images/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={40}
                height={40}
                priority
                className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg sm:text-[21px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                A<span className="text-blue-600">to</span>Z
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                Ecommerce
              </span>
            </div>
          </Link>
        </div>

        {/* Material Search Bar with Category Filter & Live Autocomplete */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative mx-2">
          <div className="w-full h-11 flex items-center bg-slate-100/80 hover:bg-slate-100 rounded-xl border border-slate-200/90 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 focus-within:shadow-sm transition-all">
            {/* Category Dropdown Selector */}
            <div className="relative h-full flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                aria-expanded={isCategoryDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Select search category filter"
                className="h-full pl-3.5 pr-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 cursor-pointer select-none whitespace-nowrap rounded-l-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              >
                <span className="max-w-[125px] truncate">{selectedCategory}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    isCategoryDropdownOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <div className="h-5 w-px bg-slate-300/80 shrink-0" aria-hidden="true" />

              {isCategoryDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Search categories"
                  className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? "text-blue-600 font-semibold bg-blue-50/70"
                            : "text-slate-700 font-medium hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
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
              placeholder="Search products, brands, or categories…"
              className="flex-1 min-w-0 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden bg-transparent"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 mr-1 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}

            {/* Inset Material Primary Search Button */}
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-8 px-4 mr-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold text-xs cursor-pointer shrink-0 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              aria-label="Submit search"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Search</span>
            </button>
          </div>

          {/* Autocomplete Dropdown Preview */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="truncate pr-2">
                  Results for <span className="text-slate-800 font-semibold">&quot;{searchQuery}&quot;</span>
                </span>
                {isLoadingSuggestions ? (
                  <span
                    className="text-[11px] text-blue-600 font-semibold flex items-center gap-1.5 shrink-0"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                    Searching…
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    Quick Preview
                  </span>
                )}
              </div>

              {/* Matching Categories section */}
              {suggestions.categories.length > 0 && (
                <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Categories
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
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group focus-visible:outline-none focus-visible:bg-blue-50"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {item.image ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {item.category?.[0] || "P"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {formatBDT(item.price)}
                        </span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  ))
                ) : isLoadingSuggestions ? (
                  <div
                    className="px-4 py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
                    <span>Searching catalog…</span>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      No exact matches found for &quot;{searchQuery}&quot;.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <Link
                        href="/collections/flash-sale"
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs font-semibold text-blue-600 hover:underline px-2.5 py-1 rounded-lg bg-blue-50/70"
                      >
                        Browse Flash Sale
                      </Link>
                      <Link
                        href="/collections/new-arrivals"
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1 rounded-lg bg-slate-100"
                      >
                        New Arrivals
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* View All Footer */}
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-full px-4 py-2.5 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50/60 bg-slate-50/70 border-t border-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span>View all results for &quot;{searchQuery}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, Account & Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="hidden md:flex items-center gap-2 h-10 px-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Wishlist, ${wishlistCount} saved items`}
          >
            <div className="relative flex items-center justify-center">
              <Heart className="w-[18px] h-[18px]" aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[13px] font-medium hidden lg:inline">Wishlist</span>
          </button>

          {/* User Account */}
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              aria-expanded={isAccountDropdownOpen}
              aria-haspopup="menu"
              className={`h-10 flex items-center gap-2 px-2.5 rounded-xl transition-colors cursor-pointer group whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isAccountDropdownOpen ? "bg-slate-100" : "hover:bg-slate-100"
              }`}
              aria-label="Account Menu"
            >
              {isAuthenticated && user ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors shrink-0">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] text-slate-500 font-medium">
                  {isAuthenticated && user
                    ? `Hi, ${user.name.split(" ")[0]}`
                    : "Sign in"}
                </span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-0.5">
                  <span>Account</span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                      isAccountDropdownOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </div>
            </button>

            {/* Account Dropdown */}
            {isAccountDropdownOpen && (
              <div
                role="menu"
                aria-label="Account options"
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <Link
                        href="/account"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Dashboard Overview
                      </Link>
                      <Link
                        href="/account/profile"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Profile &amp; Security
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Saved Addresses
                      </Link>
                      <Link
                        href="/account#orders"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <Package className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        My Orders
                      </Link>
                      <Link
                        href="/messages"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        Messages
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Heart className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Wishlist ({wishlistCount})</span>
                      </Link>

                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-0.5">
                        <Link
                          href="/freelancer/onboarding"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          <Briefcase className="w-4 h-4 text-blue-600" aria-hidden="true" />
                          <span>Become a Professional</span>
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsAccountDropdownOpen(false);
                            await logout();
                            router.push("/login");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <LogOut className="w-4 h-4 text-red-500" aria-hidden="true" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 text-center space-y-3">
                    <p className="text-xs text-slate-600">
                      Sign in to view your profile and orders
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="block w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
                    <div className="pt-2.5 border-t border-slate-100">
                      <Link
                        href="/register?role=freelancer"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                        <span>Join as a Professional</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Action Pill */}
          <button
            type="button"
            onClick={onOpenCartModal}
            className="h-10 flex items-center gap-2.5 px-3 rounded-xl bg-slate-100/80 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-colors cursor-pointer group whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={`Shopping Cart, ${cartCount} items, total ${formatBDT(cartTotal)}`}
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart
                className="w-[18px] h-[18px] text-slate-700 group-hover:text-blue-600 transition-colors"
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[9px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-[10px] text-slate-500 font-medium">Cart</span>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors tabular-nums">
                {formatBDT(cartTotal)}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
