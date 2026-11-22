import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  wishlistControllerAddProduct,
  wishlistControllerGetGuestWishlistItems,
  wishlistControllerGetWishlist,
  wishlistControllerRemoveProduct,
  wishlistControllerSyncWishlist,
  type WishlistItemResponseDto,
} from '@repo/api-client';
import { mmkvStateStorage } from '@/shared/storage/mmkv';
import { analytics } from '@/shared/analytics';
import { useAuthStore } from '../auth/auth-store';
import { registerPostLoginHook } from '../auth/auth-service';

export interface WishlistState {
  guestProductIds: string[];
  items: WishlistItemResponseDto[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  syncGuestToServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      guestProductIds: [],
      items: [],
      isLoading: false,

      isWishlisted: (productId) => {
        if (useAuthStore.getState().isAuthenticated) {
          return get().items.some((i) => i.productId === productId);
        }
        return get().guestProductIds.includes(productId);
      },

      toggleWishlist: async (productId) => {
        const currentlySaved = get().isWishlisted(productId);
        analytics.track('wishlist_toggled', {
          productId,
          action: currentlySaved ? 'remove' : 'add',
        });

        if (!useAuthStore.getState().isAuthenticated) {
          const nextIds = currentlySaved
            ? get().guestProductIds.filter((id) => id !== productId)
            : [productId, ...get().guestProductIds];
          set({ guestProductIds: nextIds });
          if (nextIds.length > 0) {
            try {
              const res = await wishlistControllerGetGuestWishlistItems({ productIds: nextIds });
              set({ items: res.data });
            } catch {
              // Keep optimistic guest IDs offline
            }
          } else {
            set({ items: [] });
          }
          return;
        }

        // Optimistic update for authenticated customer
        const previousItems = get().items;
        if (currentlySaved) {
          set({ items: previousItems.filter((i) => i.productId !== productId) });
          try {
            await wishlistControllerRemoveProduct(productId);
          } catch {
            set({ items: previousItems });
          }
        } else {
          try {
            const added = await wishlistControllerAddProduct(productId);
            if (added.status === 200) {
              set({ items: [added.data, ...previousItems.filter((i) => i.productId !== productId)] });
            }
          } catch {
            set({ items: previousItems });
          }
        }
      },

      refreshWishlist: async () => {
        set({ isLoading: true });
        try {
          if (useAuthStore.getState().isAuthenticated) {
            const res = await wishlistControllerGetWishlist();
            set({ items: res.data });
          } else {
            const ids = get().guestProductIds;
            if (ids.length === 0) {
              set({ items: [] });
            } else {
              const res = await wishlistControllerGetGuestWishlistItems({ productIds: ids });
              set({ items: res.data });
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },

      syncGuestToServer: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const guestIds = get().guestProductIds;
        if (guestIds.length > 0) {
          const res = await wishlistControllerSyncWishlist({ productIds: guestIds });
          set({ items: res.data, guestProductIds: [] });
        } else {
          const res = await wishlistControllerGetWishlist();
          set({ items: res.data });
        }
      },
    }),
    {
      name: 'az-guest-wishlist',
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ guestProductIds: state.guestProductIds }),
    },
  ),
);

registerPostLoginHook(() => useWishlistStore.getState().syncGuestToServer());
