import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { azColors } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { selectActiveCartCount, useCartStore } from '@/features/cart/cart-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';

export default function TabsLayout() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartCount = useCartStore((s) => selectActiveCartCount(s, isAuthenticated));
  const wishlistCount = useWishlistStore((s) =>
    isAuthenticated ? s.items.length : s.guestProductIds.length,
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: azColors.primary,
        tabBarInactiveTintColor: azColors.muted,
        tabBarStyle: {
          backgroundColor: azColors.surface,
          borderTopColor: azColors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarButtonTestID: 'tabs.home',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={typeof color === 'string' ? color : azColors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('tabs.categories'),
          tabBarButtonTestID: 'tabs.categories',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-grid' : 'view-grid-outline'}
              size={size}
              color={typeof color === 'string' ? color : azColors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarButtonTestID: 'tabs.cart',
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: azColors.accent, color: '#FFFFFF' },
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'cart' : 'cart-outline'}
              size={size}
              color={typeof color === 'string' ? color : azColors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t('tabs.wishlist'),
          tabBarButtonTestID: 'tabs.wishlist',
          tabBarBadge: wishlistCount > 0 ? (wishlistCount > 99 ? '99+' : wishlistCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: azColors.primary, color: '#FFFFFF' },
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={typeof color === 'string' ? color : azColors.muted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarButtonTestID: 'tabs.account',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={size}
              color={typeof color === 'string' ? color : azColors.muted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
