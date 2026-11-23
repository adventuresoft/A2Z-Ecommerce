import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { azColors, radius, spacing } from '@/shared/theme';
import { ProductCard, type ProductCardModel } from './product-card';
import { mapProductSummaryToCard } from '../utils/product-mapper';

export interface HomeCollectionData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bannerUrl?: string | null;
  badgeText?: string | null;
  designTemplate?: 'default' | 'collection-1' | 'collection-2' | string;
  startDate?: string | null;
  endDate?: string | null;
  products?: Array<Record<string, unknown>>;
}

interface HomeCollectionSectionProps {
  collection: HomeCollectionData;
  wishlistedIds: Set<string>;
  seeAllLabel: string;
  onSeeAll: () => void;
  onPressProduct: (slug: string) => void;
  onToggleWishlist: (product: ProductCardModel) => void;
  onQuickAdd: (product: ProductCardModel) => void;
}

function useCountdown(endDate?: string | null) {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!endDate) return 0;
    return Math.max(0, new Date(endDate).getTime() - Date.now());
  });

  useEffect(() => {
    if (!endDate) {
      setRemainingMs(0);
      return;
    }
    const target = new Date(endDate).getTime();
    if (!Number.isFinite(target) || target <= Date.now()) {
      setRemainingMs(0);
      return;
    }
    setRemainingMs(target - Date.now());
    const id = setInterval(() => {
      const diff = target - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (remainingMs <= 0) return null;

  const totalSec = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return { days: pad(days), hours: pad(hours), mins: pad(mins), secs: pad(secs) };
}

export function HomeCollectionSection({
  collection,
  wishlistedIds,
  seeAllLabel,
  onSeeAll,
  onPressProduct,
  onToggleWishlist,
  onQuickAdd,
}: HomeCollectionSectionProps) {
  const products = collection.products ?? [];
  const countdown = useCountdown(collection.endDate);

  if (products.length === 0) {
    return null;
  }

  const template = collection.designTemplate || 'default';
  const isFeaturedBanner = template === 'collection-1' || template === 'collection-2';
  const bannerUri = resolveMediaUrl(collection.bannerUrl, env.API_ORIGIN, 'medium');

  return (
    <View style={styles.section} testID={`home.collection.${collection.slug}`}>
      {isFeaturedBanner ? (
        <Pressable
          style={[
            styles.promoBanner,
            template === 'collection-2' ? styles.promoBannerAmber : styles.promoBannerDark,
          ]}
          onPress={onSeeAll}
        >
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              contentFit="cover"
              style={styles.promoBannerBg}
            />
          ) : null}
          <View
            style={[
              styles.promoBannerOverlay,
              template === 'collection-2' && styles.promoBannerOverlayWarm,
            ]}
          />
          <View style={styles.promoBannerContent}>
            <View style={styles.promoTopRow}>
              <View style={styles.promoBadge}>
                <MaterialCommunityIcons
                  name={template === 'collection-2' ? 'fire' : 'star-four-points'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.promoBadgeText}>
                  {(collection.badgeText || 'CURATED COLLECTION').toUpperCase()}
                </Text>
              </View>

              {countdown ? (
                <View style={styles.timerRow}>
                  <Text style={styles.timerBox}>{countdown.days}d</Text>
                  <Text style={styles.timerColon}>:</Text>
                  <Text style={styles.timerBox}>{countdown.hours}h</Text>
                  <Text style={styles.timerColon}>:</Text>
                  <Text style={styles.timerBox}>{countdown.mins}m</Text>
                  <Text style={styles.timerColon}>:</Text>
                  <Text style={styles.timerBox}>{countdown.secs}s</Text>
                </View>
              ) : null}
            </View>

            <Text variant="titleLarge" style={styles.promoTitle} numberOfLines={1}>
              {collection.name}
            </Text>
            {collection.description ? (
              <Text style={styles.promoDesc} numberOfLines={2}>
                {collection.description}
              </Text>
            ) : null}

            <View style={styles.promoActionRow}>
              <Text style={styles.promoCtaText}>{seeAllLabel}</Text>
              <MaterialCommunityIcons name="arrow-right" size={15} color="#FFFFFF" />
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {collection.badgeText ? (
              <Text style={styles.inlineBadge}>{collection.badgeText.toUpperCase()}</Text>
            ) : null}
            <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
              {collection.name}
            </Text>
            {collection.description ? (
              <Text style={styles.desc} numberOfLines={1}>
                {collection.description}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={azColors.primary} />
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {products.map((raw) => {
          const card = mapProductSummaryToCard(raw);
          return (
            <View key={card.id} style={styles.cardWrap}>
              <ProductCard
                product={card}
                isWishlisted={wishlistedIds.has(card.id)}
                onPress={onPressProduct}
                onToggleWishlist={onToggleWishlist}
                onQuickAdd={onQuickAdd}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  inlineBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: azColors.primary,
    backgroundColor: azColors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 4,
    overflow: 'hidden',
  },
  title: {
    color: azColors.navy,
    fontWeight: '800',
  },
  desc: {
    color: azColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: azColors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  promoBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 118,
    justifyContent: 'flex-end',
  },
  promoBannerDark: {
    backgroundColor: '#0F172A',
  },
  promoBannerAmber: {
    backgroundColor: '#7C2D12',
  },
  promoBannerBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  promoBannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  promoBannerOverlayWarm: {
    backgroundColor: 'rgba(124, 45, 18, 0.76)',
  },
  promoBannerContent: {
    padding: spacing.md,
    gap: 4,
  },
  promoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: azColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  timerColon: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 10,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  promoDesc: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 17,
  },
  promoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  promoCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rail: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  cardWrap: {
    width: 168,
  },
});
