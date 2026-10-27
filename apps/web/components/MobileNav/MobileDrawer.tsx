import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ChevronRight,
  ChevronDown,
  PhoneCall,
  ShieldCheck,
  Tag,
  LogOut,
  MapPin,
  LayoutDashboard,
  Cpu,
  Shirt,
  Home,
  HeartPulse,
  Dumbbell,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  CategoryTreeNode,
  fetchCategoryTree,
  getCategoryStyleTheme,
  FALLBACK_CATEGORY_TREE,
} from "../../lib/categories";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to render dynamic icon based on theme
function MobileCategoryIcon({ name, className }: { name: string; className?: string }) {
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

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [categories, setCategories] = useState<CategoryTreeNode[]>(FALLBACK_CATEGORY_TREE);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadTree() {
      try {
        const tree = await fetchCategoryTree();
        if (isMounted && tree.length > 0) {
          setCategories(tree);
        }
      } catch (err) {
        console.warn("Could not load categories for mobile drawer:", err);
      }
    }
    if (isOpen) {
      loadTree();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const toggleCategory = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSubcategory = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubcategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
              <Image
                src="/brand/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">A to Z Ecommerce</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Account Strip */}
        <div className="p-4 border-b border-slate-100 bg-blue-50/50">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 hover:text-blue-600 shadow-2xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                  Dashboard
                </Link>
                <Link
                  href="/account/addresses"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 hover:text-blue-600 shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Addresses
                </Link>
              </div>

              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Sign in for orders, address book, and warranty
              </p>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs text-center"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Hierarchical Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Browse Categories
          </div>

          {categories.map((cat) => {
            const theme = getCategoryStyleTheme(cat.slug, cat.name);
            const hasChildren = Boolean(cat.children && cat.children.length > 0);
            const isExpanded = Boolean(expandedCategories[cat.id]);

            return (
              <div key={cat.id} className="rounded-xl overflow-hidden border border-transparent transition-colors">
                {/* Parent Row */}
                <div className="flex items-center justify-between hover:bg-slate-50 rounded-xl p-1">
                  <Link
                    href={`/category/${cat.slug}`}
                    onClick={onClose}
                    className="flex items-center space-x-2.5 px-2 py-1.5 text-slate-700 text-xs font-semibold flex-1 min-w-0"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme.badgeBg}`}
                    >
                      <MobileCategoryIcon name={theme.iconName} className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </Link>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => toggleCategory(cat.id, e)}
                      aria-label={`Toggle ${cat.name} subcategories`}
                      className="p-2 text-slate-400 hover:text-blue-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Subcategories (Level 2) Accordion */}
                {hasChildren && isExpanded && (
                  <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50/70 rounded-b-xl border-l-2 border-blue-500 ml-4 mb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {cat.children.map((sub) => {
                      const hasLeafs = Boolean(sub.children && sub.children.length > 0);
                      const isSubExpanded = Boolean(expandedSubcategories[sub.id]);

                      return (
                        <div key={sub.id} className="space-y-0.5">
                          <div className="flex items-center justify-between py-1">
                            <Link
                              href={`/category/${sub.slug}`}
                              onClick={onClose}
                              className="text-xs font-semibold text-slate-800 hover:text-blue-700 transition-colors flex-1"
                            >
                              {sub.name}
                            </Link>

                            {hasLeafs && (
                              <button
                                type="button"
                                onClick={(e) => toggleSubcategory(sub.id, e)}
                                aria-label={`Toggle ${sub.name} items`}
                                className="p-1 text-slate-400 hover:text-blue-700"
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                    isSubExpanded ? "rotate-180 text-blue-600" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Leaf Subcategories (Level 3) */}
                          {hasLeafs && isSubExpanded && (
                            <div className="pl-3 py-1 space-y-1 border-l border-slate-200">
                              {sub.children.map((leaf) => (
                                <Link
                                  key={leaf.id}
                                  href={`/category/${leaf.slug}`}
                                  onClick={onClose}
                                  className="block text-[11px] text-slate-500 hover:text-blue-600 py-0.5"
                                >
                                  • {leaf.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Quick Shortcuts
            </div>
            <Link
              href="/archive"
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 text-orange-600 text-xs font-bold"
            >
              <Tag className="w-4 h-4" />
              <span>Archive & Clearance Deals</span>
            </Link>
            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-700 text-xs font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>All Products Catalog</span>
            </Link>
          </div>
        </div>

        {/* Footer Support */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-blue-700" />
            <span>Support: 09678-123456</span>
          </div>
        </div>
      </div>
    </div>
  );
}
