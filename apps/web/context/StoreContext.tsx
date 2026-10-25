"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ALL_PRODUCTS, Product } from "../data/mock-catalog";
import { ToastMessage } from "../components/UI/Toast";
import { useAuth } from "./AuthContext";
import { apiClient } from "../lib/api-client";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
  variantId?: string;
  price: number;
}

export interface WishlistProductEntry {
  id: string;
  productId: string;
  title: string;
  slug: string;
  category: string;
  brand?: string | null;
  image: string;
  price: number;
  regularPrice?: number;
  discountPercent?: number | null;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  availableQuantity?: number;
  isUnavailable: boolean;
  defaultVariantId?: string | null;
  sku?: string | null;
  createdAt?: string;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    variantLabel?: string,
    unitPrice?: number,
    variantId?: string
  ) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalCartCount: number;
  totalCartPrice: number;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (open: boolean) => void;

  wishlistIds: Set<string>;
  wishlistItems: WishlistProductEntry[];
  isLoadingWishlist: boolean;
  toggleWishlist: (productId: string, productHint?: Partial<Product>) => void;
  removeFromWishlist: (productId: string) => Promise<void>;
  moveWishlistToCart: (item: WishlistProductEntry) => void;
  refreshWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;

  toasts: ToastMessage[];
  addToast: (
    title: string,
    desc?: string,
    type?: "success" | "info" | "warning"
  ) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function mapApiWishlistItemToEntry(item: any): WishlistProductEntry {
  const p = item.product || item;
  const effectivePrice =
    p.effectivePrice !== undefined
      ? Number(p.effectivePrice)
      : p.salePrice != null && Number(p.salePrice) > 0
      ? Number(p.salePrice)
      : Number(p.regularPrice || p.price || 0);
  const regularPrice = Number(p.regularPrice || p.price || effectivePrice);

  return {
    id: item.id || `wl-${p.id}`,
    productId: item.productId || p.id,
    title: p.title,
    slug: p.slug || p.id,
    category: p.categoryName || p.category || "General",
    brand: p.brandName || p.brand || null,
    image:
      p.imageUrl ||
      p.image ||
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80",
    price: effectivePrice,
    regularPrice: regularPrice > effectivePrice ? regularPrice : undefined,
    discountPercent: p.discountPercent ?? null,
    rating: Number(p.rating || 4.8),
    reviewsCount: Number(p.reviewsCount || 12),
    inStock: Boolean(p.inStock),
    availableQuantity:
      p.availableQuantity !== undefined ? Number(p.availableQuantity) : undefined,
    isUnavailable: Boolean(p.isUnavailable),
    defaultVariantId: p.defaultVariantId || null,
    sku: p.sku || null,
    createdAt: item.createdAt,
  };
}

function mapMockProductToEntry(p: Product): WishlistProductEntry {
  return {
    id: `mock-${p.id}`,
    productId: p.id,
    title: p.title,
    slug: p.slug || p.id,
    category: p.category || "General",
    brand: p.brand || null,
    image: p.image,
    price: p.price,
    regularPrice: p.regularPrice,
    discountPercent: p.discountPercent ?? null,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    inStock: p.inStock !== false,
    availableQuantity: p.stockTotal ?? 10,
    isUnavailable: false,
    defaultVariantId: p.defaultVariantId || null,
    sku: p.sku || null,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistItems, setWishlistItems] = useState<WishlistProductEntry[]>(
    []
  );
  const [isLoadingWishlist, setIsLoadingWishlist] = useState<boolean>(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const addToast = useCallback(
    (
      title: string,
      desc?: string,
      type: "success" | "info" | "warning" = "success"
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, title, desc, type };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate cart and guest wishlist from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("az_cart_items");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }

      const savedGuestWishlist =
        localStorage.getItem("az_guest_wishlist_ids") ||
        localStorage.getItem("az_wishlist_ids");
      if (savedGuestWishlist) {
        const parsed = JSON.parse(savedGuestWishlist);
        if (Array.isArray(parsed)) {
          setWishlistIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsHydrated(true);
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("az_cart_items", JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart, isHydrated]);

  // Persist wishlist IDs to localStorage for guests
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const arr = Array.from(wishlistIds);
      localStorage.setItem("az_wishlist_ids", JSON.stringify(arr));
      if (!isAuthenticated) {
        localStorage.setItem("az_guest_wishlist_ids", JSON.stringify(arr));
      }
    } catch {
      // Ignore
    }
  }, [wishlistIds, isHydrated, isAuthenticated]);

  // Load or sync wishlist from API/localStorage
  const refreshWishlist = useCallback(async () => {
    if (!isHydrated || authLoading) return;

    if (isAuthenticated && user) {
      setIsLoadingWishlist(true);
      try {
        // Check if guest had any un-synced wishlist IDs
        let guestIds: string[] = [];
        try {
          const rawGuest = localStorage.getItem("az_guest_wishlist_ids");
          if (rawGuest) {
            const parsed = JSON.parse(rawGuest);
            if (Array.isArray(parsed) && parsed.length > 0) {
              guestIds = parsed;
            }
          }
        } catch {
          // ignore
        }

        let apiItems: any[];
        if (guestIds.length > 0) {
          apiItems = await apiClient.post<any[]>("/wishlist/sync", {
            productIds: guestIds,
          });
          localStorage.removeItem("az_guest_wishlist_ids");
        } else {
          apiItems = await apiClient.get<any[]>("/wishlist");
        }

        const mapped = (apiItems || []).map(mapApiWishlistItemToEntry);
        setWishlistItems(mapped);
        setWishlistIds(new Set(mapped.map((m) => m.productId)));
      } catch {
        // Keep current state if offline
      } finally {
        setIsLoadingWishlist(false);
      }
    } else {
      // Guest mode: resolve any saved IDs via public guest-items endpoint + mock catalog fallback
      const currentIds = Array.from(wishlistIds);
      if (currentIds.length === 0) {
        setWishlistItems([]);
        return;
      }

      setIsLoadingWishlist(true);
      try {
        let apiResolved: WishlistProductEntry[] = [];
        try {
          const guestApiItems = await apiClient.post<any[]>(
            "/wishlist/guest-items",
            { productIds: currentIds },
            { skipAuth: true }
          );
          apiResolved = (guestApiItems || []).map(mapApiWishlistItemToEntry);
        } catch {
          // Ignore if backend unavailable
        }

        const resolvedIds = new Set(apiResolved.map((r) => r.productId));
        const resolvedSlugs = new Set(apiResolved.map((r) => r.slug));

        const mockFallbacks = ALL_PRODUCTS.filter(
          (p) =>
            currentIds.includes(p.id) &&
            !resolvedIds.has(p.id) &&
            (!p.slug || !resolvedSlugs.has(p.slug))
        ).map(mapMockProductToEntry);

        setWishlistItems([...apiResolved, ...mockFallbacks]);
      } finally {
        setIsLoadingWishlist(false);
      }
    }
  }, [isHydrated, authLoading, isAuthenticated, user, wishlistIds.size]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Listen for AuthContext login/register sync and logout events
  useEffect(() => {
    const handleSynced = (e: Event) => {
      const customEvent = e as CustomEvent<any[]>;
      const syncedList = customEvent.detail;
      if (Array.isArray(syncedList)) {
        const mapped = syncedList.map(mapApiWishlistItemToEntry);
        setWishlistItems(mapped);
        setWishlistIds(new Set(mapped.map((m) => m.productId)));
      } else {
        refreshWishlist();
      }
    };

    const handleLoggedOut = () => {
      setWishlistIds(new Set());
      setWishlistItems([]);
      try {
        localStorage.removeItem("az_wishlist_ids");
        localStorage.removeItem("az_guest_wishlist_ids");
      } catch {
        // ignore
      }
    };

    window.addEventListener("az:wishlist-synced", handleSynced);
    window.addEventListener("az:auth-logged-out", handleLoggedOut);
    return () => {
      window.removeEventListener("az:wishlist-synced", handleSynced);
      window.removeEventListener("az:auth-logged-out", handleLoggedOut);
    };
  }, [refreshWishlist]);

  const addToCart = (
    product: Product,
    quantity = 1,
    variantLabel?: string,
    unitPrice?: number,
    variantId?: string
  ) => {
    const itemPrice = unitPrice !== undefined ? unitPrice : product.price;
    const resolvedVariantId = variantId || product.defaultVariantId;
    const cartItemId =
      resolvedVariantId ||
      (variantLabel ? `${product.id}-${variantLabel}` : product.id);

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === cartItemId ||
          (resolvedVariantId && item.variantId === resolvedVariantId)
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedVariant: variantLabel,
          variantId: resolvedVariantId,
          price: itemPrice,
        },
      ];
    });

    addToast(
      "Added to Cart",
      `${product.title.substring(0, 32)}... has been added to your shopping bag.`,
      "success"
    );
    setIsCartModalOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    addToast(
      "Item Removed",
      "The item has been removed from your shopping cart.",
      "info"
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setWishlistItems((prev) =>
      prev.filter((item) => item.productId !== productId && item.slug !== productId)
    );
    addToast(
      "Removed from Wishlist",
      "Product removed from your saved favorites.",
      "info"
    );

    if (isAuthenticated && user) {
      try {
        await apiClient.delete(`/wishlist/${encodeURIComponent(productId)}`);
      } catch {
        // Re-sync if failed
        refreshWishlist();
      }
    }
  };

  const toggleWishlist = (
    productId: string,
    productHint?: Partial<Product>
  ) => {
    const currentlySaved = wishlistIds.has(productId);

    if (currentlySaved) {
      void removeFromWishlist(productId);
      return;
    }

    // Optimistic add
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });

    if (productHint && productHint.title) {
      const optimisticEntry: WishlistProductEntry = {
        id: `temp-${productId}`,
        productId,
        title: productHint.title,
        slug: productHint.slug || productId,
        category: productHint.category || "General",
        brand: productHint.brand || null,
        image: productHint.image || "/placeholder.png",
        price: productHint.price || 0,
        regularPrice: productHint.regularPrice,
        discountPercent: productHint.discountPercent ?? null,
        rating: productHint.rating || 4.8,
        reviewsCount: productHint.reviewsCount || 12,
        inStock: productHint.inStock !== false,
        availableQuantity: productHint.stockTotal ?? 10,
        isUnavailable: false,
        defaultVariantId: productHint.defaultVariantId || null,
        sku: productHint.sku || null,
      };
      setWishlistItems((prev) => [
        optimisticEntry,
        ...prev.filter((i) => i.productId !== productId),
      ]);
    }

    addToast(
      "Added to Wishlist",
      "Product saved to your favorites wishlist.",
      "info"
    );

    if (isAuthenticated && user) {
      apiClient
        .post<any>(`/wishlist/${encodeURIComponent(productId)}`, {})
        .then((savedItem) => {
          if (savedItem) {
            const entry = mapApiWishlistItemToEntry(savedItem);
            setWishlistIds((prev) => {
              const next = new Set(prev);
              next.add(entry.productId);
              return next;
            });
            setWishlistItems((prev) => [
              entry,
              ...prev.filter(
                (i) => i.productId !== productId && i.productId !== entry.productId
              ),
            ]);
          }
        })
        .catch(() => {
          refreshWishlist();
        });
    }
  };

  const moveWishlistToCart = (item: WishlistProductEntry) => {
    if (item.isUnavailable) {
      addToast(
        "Product Unavailable",
        `"${item.title}" has been discontinued and cannot be added to cart.`,
        "warning"
      );
      return;
    }

    if (
      !item.inStock ||
      (item.availableQuantity !== undefined && item.availableQuantity <= 0)
    ) {
      addToast(
        "Out of Stock",
        `"${item.title}" is currently out of stock.`,
        "warning"
      );
      return;
    }

    const cartProduct: Product = {
      id: item.productId,
      slug: item.slug,
      defaultVariantId: item.defaultVariantId || undefined,
      title: item.title,
      category: item.category,
      brand: item.brand || undefined,
      sku: item.sku || undefined,
      price: item.price,
      regularPrice: item.regularPrice,
      discountPercent: item.discountPercent || undefined,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
      image: item.image,
      inStock: item.inStock,
      stockTotal: item.availableQuantity,
    };

    addToCart(
      cartProduct,
      1,
      undefined,
      item.price,
      item.defaultVariantId || undefined
    );
  };

  const isWishlisted = (productId: string) => wishlistIds.has(productId);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCartCount,
        totalCartPrice,
        isCartModalOpen,
        setIsCartModalOpen,
        wishlistIds,
        wishlistItems,
        isLoadingWishlist,
        toggleWishlist,
        removeFromWishlist,
        moveWishlistToCart,
        refreshWishlist,
        isWishlisted,
        wishlistCount: wishlistIds.size,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
