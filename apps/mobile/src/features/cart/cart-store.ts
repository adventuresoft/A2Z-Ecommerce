import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cartControllerAddItem,
  cartControllerClearCart,
  cartControllerGetCart,
  cartControllerRemoveItem,
  cartControllerSyncCart,
  cartControllerUpdateItem,
  type CartItemResponseDto,
  type CartWarningDto,
} from '@repo/api-client';
import { mmkvStateStorage } from '@/shared/storage/mmkv';
import { analytics } from '@/shared/analytics';
import { useAuthStore } from '../auth/auth-store';
import { registerPostLoginHook } from '../auth/auth-service';

export interface GuestCartItem {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  sku: string;
  variantLabel?: string | null;
  imageUrl?: string | null;
  price: number;
  regularPrice?: number | null;
  quantity: number;
}

export interface CartState {
  guestItems: GuestCartItem[];
  serverItems: CartItemResponseDto[];
  syncWarnings: CartWarningDto[];
  isSyncing: boolean;
  addItem: (item: GuestCartItem, source?: string) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshServerCart: () => Promise<void>;
  syncGuestToServer: () => Promise<void>;
  clearWarnings: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      guestItems: [],
      serverItems: [],
      syncWarnings: [],
      isSyncing: false,

      addItem: async (item, source = 'pdp') => {
        analytics.track('add_to_cart', {
          productId: item.productId,
          variantId: item.variantId,
          price: item.price,
          quantity: item.quantity,
          source,
        });

        if (useAuthStore.getState().isAuthenticated) {
          const res = await cartControllerAddItem({
            variantId: item.variantId,
            quantity: item.quantity,
          });
          if (res.status === 200) {
            set({ serverItems: res.data.items });
          }
          return;
        }

        const existing = get().guestItems.find((i) => i.variantId === item.variantId);
        const nextGuest = existing
          ? get().guestItems.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            )
          : [item, ...get().guestItems];
        set({ guestItems: nextGuest });
      },

      updateQuantity: async (variantId, quantity) => {
        if (useAuthStore.getState().isAuthenticated) {
          const res = await cartControllerUpdateItem(variantId, { quantity: Math.max(0, quantity) });
          set({ serverItems: res.data.items });
          return;
        }

        if (quantity <= 0) {
          set({ guestItems: get().guestItems.filter((i) => i.variantId !== variantId) });
          return;
        }
        set({
          guestItems: get().guestItems.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },

      removeItem: async (variantId) => {
        if (useAuthStore.getState().isAuthenticated) {
          const res = await cartControllerRemoveItem(variantId);
          set({ serverItems: res.data.items });
          return;
        }
        set({ guestItems: get().guestItems.filter((i) => i.variantId !== variantId) });
      },

      clearAll: async () => {
        if (useAuthStore.getState().isAuthenticated) {
          await cartControllerClearCart();
          set({ serverItems: [], guestItems: [] });
          return;
        }
        set({ guestItems: [] });
      },

      refreshServerCart: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const res = await cartControllerGetCart();
        if (res.status === 200) {
          set({ serverItems: res.data.items });
        }
      },

      syncGuestToServer: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        set({ isSyncing: true });
        try {
          const guestItems = get().guestItems;
          if (guestItems.length > 0) {
            const res = await cartControllerSyncCart({
              items: guestItems.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            });
            set({
              serverItems: res.data.items,
              guestItems: [],
              syncWarnings: res.data.warnings ?? [],
            });
          } else {
            const res = await cartControllerGetCart();
            if (res.status === 200) {
              set({ serverItems: res.data.items });
            }
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      clearWarnings: () => set({ syncWarnings: [] }),
    }),
    {
      name: 'az-guest-cart',
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ guestItems: state.guestItems }),
    },
  ),
);

registerPostLoginHook(() => useCartStore.getState().syncGuestToServer());

export function selectActiveCartCount(state: CartState, isAuthenticated: boolean): number {
  const list = isAuthenticated ? state.serverItems : state.guestItems;
  return list.reduce((sum, item) => sum + item.quantity, 0);
}
