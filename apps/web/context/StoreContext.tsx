"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product } from "../data/mock-catalog";
import { ToastMessage } from "../components/UI/Toast";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
  price: number;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variantLabel?: string, unitPrice?: number) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalCartCount: number;
  totalCartPrice: number;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (open: boolean) => void;
  
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  wishlistCount: number;
  
  toasts: ToastMessage[];
  addToast: (title: string, desc?: string, type?: "success" | "info" | "warning") => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set(["fs-1", "phone-2"]));
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("az_cart_items");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        // Default initial seed item
        setCart([
          {
            id: "seed-1",
            product: {
              id: "seed-1",
              title: "Sony WH-1000XM5 Wireless Headphones",
              category: "Audio Gear",
              price: 38500,
              rating: 4.9,
              reviewsCount: 140,
              image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
            },
            quantity: 1,
            price: 38500,
          },
        ]);
      }

      const savedWishlist = localStorage.getItem("az_wishlist_ids");
      if (savedWishlist) {
        setWishlistIds(new Set(JSON.parse(savedWishlist)));
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("az_cart_items", JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("az_wishlist_ids", JSON.stringify(Array.from(wishlistIds)));
    } catch {
      // Ignore
    }
  }, [wishlistIds, isHydrated]);

  const addToast = (
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
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    variantLabel?: string,
    unitPrice?: number
  ) => {
    const itemPrice = unitPrice !== undefined ? unitPrice : product.price;
    const cartItemId = variantLabel ? `${product.id}-${variantLabel}` : product.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedVariant: variantLabel,
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
    addToast("Item Removed", "The item has been removed from your shopping cart.", "info");
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(productId);
      if (isAdding) {
        next.add(productId);
        addToast("Added to Wishlist", "Product saved to your favorites wishlist.", "info");
      } else {
        next.delete(productId);
        addToast("Removed from Wishlist", "Product removed from your favorites.", "info");
      }
      return next;
    });
  };

  const isWishlisted = (productId: string) => wishlistIds.has(productId);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
        toggleWishlist,
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
