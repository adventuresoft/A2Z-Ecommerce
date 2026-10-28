import { apiClient } from "./api-client";

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder: number;
  showInBrowseCatalog?: boolean;
  productsCount?: number;
  children: CategoryTreeNode[];
}

export interface BrowseCatalogCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder: number;
  parentId?: string | null;
  showInBrowseCatalog?: boolean;
  productsCount?: number;
}

/**
 * Fallback tree if backend is temporarily offline or loading
 */
export const FALLBACK_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80",
    sortOrder: 1,
    children: [
      {
        id: "smartphones-tablets",
        name: "Smartphones & Tablets",
        slug: "smartphones-tablets",
        sortOrder: 1,
        children: [
          { id: "android-smartphones", name: "Android Smartphones", slug: "android-smartphones", sortOrder: 1, children: [] },
          { id: "apple-iphones", name: "Apple iPhones", slug: "apple-iphones", sortOrder: 2, children: [] },
          { id: "tablets-ipads", name: "Tablets & iPads", slug: "tablets-ipads", sortOrder: 3, children: [] },
        ],
      },
      {
        id: "computers-laptops",
        name: "Computers & Laptops",
        slug: "computers-laptops",
        sortOrder: 2,
        children: [
          { id: "gaming-laptops", name: "Gaming Laptops", slug: "gaming-laptops", sortOrder: 1, children: [] },
          { id: "ultrabooks-workstations", name: "Ultrabooks & Workstations", slug: "ultrabooks-workstations", sortOrder: 2, children: [] },
          { id: "pc-accessories", name: "PC Accessories", slug: "pc-accessories", sortOrder: 3, children: [] },
        ],
      },
      {
        id: "audio-headphones",
        name: "Audio & Headphones",
        slug: "audio-headphones",
        sortOrder: 3,
        children: [
          { id: "wireless-earbuds", name: "Wireless Earbuds", slug: "wireless-earbuds", sortOrder: 1, children: [] },
          { id: "bluetooth-speakers", name: "Bluetooth Speakers", slug: "bluetooth-speakers", sortOrder: 2, children: [] },
        ],
      },
    ],
  },
  {
    id: "fashion-apparel",
    name: "Fashion & Apparel",
    slug: "fashion-apparel",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80",
    sortOrder: 2,
    children: [
      {
        id: "mens-fashion",
        name: "Men's Fashion",
        slug: "mens-fashion",
        sortOrder: 1,
        children: [
          { id: "mens-casual-shirts-polos", name: "Casual Shirts & Polos", slug: "mens-casual-shirts-polos", sortOrder: 1, children: [] },
          { id: "mens-jeans-chinos", name: "Jeans & Chinos", slug: "mens-jeans-chinos", sortOrder: 2, children: [] },
          { id: "mens-footwear-sneakers", name: "Footwear & Sneakers", slug: "mens-footwear-sneakers", sortOrder: 3, children: [] },
        ],
      },
      {
        id: "womens-fashion",
        name: "Women's Fashion",
        slug: "womens-fashion",
        sortOrder: 2,
        children: [
          { id: "womens-dresses-tops", name: "Dresses & Tops", slug: "womens-dresses-tops", sortOrder: 1, children: [] },
          { id: "womens-handbags-clutches", name: "Handbags & Clutches", slug: "womens-handbags-clutches", sortOrder: 2, children: [] },
          { id: "womens-ethnic-festive-wear", name: "Ethnic & Festive Wear", slug: "womens-ethnic-festive-wear", sortOrder: 3, children: [] },
        ],
      },
      {
        id: "watches-accessories",
        name: "Watches & Accessories",
        slug: "watches-accessories",
        sortOrder: 3,
        children: [
          { id: "smartwatches", name: "Smartwatches", slug: "smartwatches", sortOrder: 1, children: [] },
          { id: "luxury-watches", name: "Luxury Watches", slug: "luxury-watches", sortOrder: 2, children: [] },
        ],
      },
    ],
  },
  {
    id: "home-living",
    name: "Home & Living",
    slug: "home-living",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80",
    sortOrder: 3,
    children: [
      {
        id: "kitchen-dining",
        name: "Kitchen & Dining",
        slug: "kitchen-dining",
        sortOrder: 1,
        children: [
          { id: "cookware-sets", name: "Cookware & Sets", slug: "cookware-sets", sortOrder: 1, children: [] },
          { id: "dinnerware-crockery", name: "Dinnerware & Crockery", slug: "dinnerware-crockery", sortOrder: 2, children: [] },
        ],
      },
      {
        id: "home-decor-lighting",
        name: "Home Decor & Lighting",
        slug: "home-decor-lighting",
        sortOrder: 2,
        children: [
          { id: "pendant-lamps", name: "Lamps & Ambient Lighting", slug: "lamps-lighting", sortOrder: 1, children: [] },
          { id: "wall-art-clocks", name: "Wall Art & Clocks", slug: "wall-art-clocks", sortOrder: 2, children: [] },
        ],
      },
    ],
  },
  {
    id: "health-beauty",
    name: "Health & Beauty",
    slug: "health-beauty",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
    sortOrder: 4,
    children: [
      {
        id: "skincare-treatments",
        name: "Skincare & Treatments",
        slug: "skincare-treatments",
        sortOrder: 1,
        children: [
          { id: "cleansers-toners", name: "Cleansers & Toners", slug: "cleansers-toners", sortOrder: 1, children: [] },
          { id: "serums-creams", name: "Serums & Night Creams", slug: "serums-creams", sortOrder: 2, children: [] },
        ],
      },
      {
        id: "fragrances-perfumes",
        name: "Fragrances & Perfumes",
        slug: "fragrances-perfumes",
        sortOrder: 2,
        children: [
          { id: "mens-cologne", name: "Men's Cologne & EDP", slug: "mens-cologne", sortOrder: 1, children: [] },
          { id: "womens-perfume", name: "Women's Perfume & Mist", slug: "womens-perfume", sortOrder: 2, children: [] },
        ],
      },
    ],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
    sortOrder: 5,
    children: [
      {
        id: "fitness-gym",
        name: "Fitness & Gym",
        slug: "fitness-gym",
        sortOrder: 1,
        children: [
          { id: "resistance-bands", name: "Resistance Bands & Mats", slug: "bands-mats", sortOrder: 1, children: [] },
          { id: "dumbbells-kettlebells", name: "Weights & Dumbbells", slug: "weights-dumbbells", sortOrder: 2, children: [] },
        ],
      },
      {
        id: "outdoor-gear",
        name: "Outdoor Gear",
        slug: "outdoor-gear",
        sortOrder: 2,
        children: [
          { id: "camping-hiking", name: "Trekking & Camping Essentials", slug: "trekking-camping", sortOrder: 1, children: [] },
        ],
      },
    ],
  },
];

// In-memory cache to avoid redundant API hits across navigation
let cachedTree: CategoryTreeNode[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function fetchCategoryTree(forceRefresh = false): Promise<CategoryTreeNode[]> {
  const now = Date.now();
  if (!forceRefresh && cachedTree && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedTree;
  }

  try {
    const data = await apiClient.get<CategoryTreeNode[]>("/categories/tree", {
      skipAuth: true,
    });

    if (Array.isArray(data) && data.length > 0) {
      cachedTree = data;
      lastFetchTime = now;
      return data;
    }
  } catch (error) {
    console.warn("Could not fetch categories tree from backend API, using fallback data:", error);
  }

  // Fallback if offline or empty response
  if (!cachedTree) {
    cachedTree = FALLBACK_CATEGORY_TREE;
  }
  return cachedTree;
}

let cachedBrowseCatalog: BrowseCatalogCategory[] | null = null;
let lastBrowseCatalogFetchTime = 0;

export async function fetchBrowseCatalogCategories(forceRefresh = false): Promise<BrowseCatalogCategory[]> {
  const now = Date.now();
  if (!forceRefresh && cachedBrowseCatalog && now - lastBrowseCatalogFetchTime < CACHE_TTL_MS) {
    return cachedBrowseCatalog;
  }

  try {
    const data = await apiClient.get<BrowseCatalogCategory[]>("/categories/browse-catalog", {
      skipAuth: true,
    });

    if (Array.isArray(data) && data.length > 0) {
      cachedBrowseCatalog = data;
      lastBrowseCatalogFetchTime = now;
      return data;
    }
  } catch (error) {
    console.warn("Could not fetch browse catalog categories from backend API, using fallback tree:", error);
  }

  // Fallback if API fails or is offline: map from cached or fallback root categories
  const fallback = (cachedTree || FALLBACK_CATEGORY_TREE).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    showInBrowseCatalog: true,
    productsCount: c.productsCount,
  }));

  return fallback;
}

/**
 * Visual styling theme per category root
 */
export interface CategoryStyleTheme {
  iconName: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  accentBg: string;
  tagline: string;
}

export function getCategoryStyleTheme(slug: string, name: string): CategoryStyleTheme {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  if (s.includes("electro") || n.includes("electro") || s.includes("pc") || s.includes("comp")) {
    return {
      iconName: "Cpu",
      badgeBg: "bg-blue-50 text-blue-700",
      badgeText: "text-blue-700",
      borderHover: "hover:border-blue-500",
      accentBg: "from-blue-600/10 to-indigo-600/10",
      tagline: "High-performance tech & verified computing gear",
    };
  }

  if (s.includes("fashion") || n.includes("fashion") || s.includes("apparel") || s.includes("cloth")) {
    return {
      iconName: "Shirt",
      badgeBg: "bg-purple-50 text-purple-700",
      badgeText: "text-purple-700",
      borderHover: "hover:border-purple-500",
      accentBg: "from-purple-600/10 to-pink-600/10",
      tagline: "Trending seasonal wear, watches & premium accessories",
    };
  }

  if (s.includes("home") || n.includes("home") || s.includes("living") || s.includes("kitchen")) {
    return {
      iconName: "Home",
      badgeBg: "bg-amber-50 text-amber-700",
      badgeText: "text-amber-700",
      borderHover: "hover:border-amber-500",
      accentBg: "from-amber-600/10 to-orange-600/10",
      tagline: "Modern dining, ambient lights & elegant interior decor",
    };
  }

  if (s.includes("health") || n.includes("health") || s.includes("beauty") || s.includes("care")) {
    return {
      iconName: "HeartPulse",
      badgeBg: "bg-emerald-50 text-emerald-700",
      badgeText: "text-emerald-700",
      borderHover: "hover:border-emerald-500",
      accentBg: "from-emerald-600/10 to-teal-600/10",
      tagline: "Dermatologist-tested skincare, fragrances & personal care",
    };
  }

  if (s.includes("sport") || n.includes("sport") || s.includes("outdoor") || s.includes("gym") || s.includes("fit")) {
    return {
      iconName: "Dumbbell",
      badgeBg: "bg-cyan-50 text-cyan-700",
      badgeText: "text-cyan-700",
      borderHover: "hover:border-cyan-500",
      accentBg: "from-cyan-600/10 to-blue-600/10",
      tagline: "Workout equipment, athletics & durable trekking gear",
    };
  }

  // Fallback general style
  return {
    iconName: "Layers",
    badgeBg: "bg-slate-100 text-slate-700",
    badgeText: "text-slate-700",
    borderHover: "hover:border-slate-400",
    accentBg: "from-slate-100 to-slate-200",
    tagline: "Curated premium products with warranty",
  };
}
