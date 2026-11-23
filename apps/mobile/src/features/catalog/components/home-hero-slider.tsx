import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl, type HeroBannerItemDto } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { azColors, radius, spacing } from '@/shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = spacing.md;
const SLIDE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;

interface HomeHeroSliderProps {
  banners: HeroBannerItemDto[];
  onNavigateLink: (rawLink?: string | null) => void;
}

function HeroSlideCard({
  banner,
  onPress,
}: {
  banner: HeroBannerItemDto;
  onPress: () => void;
}) {
  const preferredUrl = banner.mobileImageUrl?.trim() || banner.imageUrl;
  const mediumUri = resolveMediaUrl(preferredUrl, env.API_ORIGIN, 'medium');
  const originalUri = resolveMediaUrl(preferredUrl, env.API_ORIGIN, 'original');
  const [useOriginal, setUseOriginal] = useState(false);

  const imageUri = useOriginal ? originalUri : mediumUri;
  const cleanBadge = (banner.badgeText || 'FEATURED DEAL')
    .replace(/^[^\w\d\s]+\s*/, '')
    .toUpperCase();
  const ctaLabel = banner.ctaText?.trim() || 'Explore Now';

  return (
    <Pressable
      style={[styles.card, { width: SLIDE_WIDTH }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={banner.title}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          style={styles.bgImage}
          onError={() => {
            if (!useOriginal && originalUri && originalUri !== mediumUri) {
              setUseOriginal(true);
            }
          }}
        />
      ) : null}

      {/* Obsidian dark studio scrim matching Web HeroSlider */}
      <View style={styles.scrim} />

      <View style={styles.content}>
        <View style={styles.badgePill}>
          <MaterialCommunityIcons name="star-four-points" size={12} color="#F59E0B" />
          <Text style={styles.badgeText} numberOfLines={1}>
            {cleanBadge}
          </Text>
        </View>

        <Text variant="headlineSmall" style={styles.title} numberOfLines={2}>
          {banner.title}
        </Text>

        {banner.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {banner.subtitle}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={styles.ctaPill}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={15} color="#FFFFFF" />
          </View>

          <View style={styles.trustMicro}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#94A3B8" />
            <Text style={styles.trustMicroText}>Official Warranty</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeHeroSlider({ banners, onNavigateLink }: HomeHeroSliderProps) {
  const listRef = useRef<FlatList<HeroBannerItemDto>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const visibleBanners = banners.filter((b) => b.isActive !== false);

  useEffect(() => {
    if (visibleBanners.length <= 1 || isDragging) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % visibleBanners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [visibleBanners.length, isDragging]);

  if (visibleBanners.length === 0) {
    return null;
  }

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / (SLIDE_WIDTH + spacing.sm));
    setActiveIndex(Math.max(0, Math.min(visibleBanners.length - 1, idx)));
    setIsDragging(false);
  };

  return (
    <View style={styles.wrapper} testID="home.heroSlider">
      <FlatList
        ref={listRef}
        data={visibleBanners}
        keyExtractor={(item, idx) => item.id || `hero-${idx}`}
        horizontal
        pagingEnabled={false}
        snapToInterval={SLIDE_WIDTH + spacing.sm}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
        onScrollBeginDrag={() => setIsDragging(true)}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH + spacing.sm,
          offset: (SLIDE_WIDTH + spacing.sm) * index,
          index,
        })}
        renderItem={({ item }) => (
          <HeroSlideCard
            banner={item}
            onPress={() => onNavigateLink(item.linkUrl)}
          />
        )}
      />

      {visibleBanners.length > 1 ? (
        <View style={styles.dotsRow}>
          {visibleBanners.map((b, idx) => (
            <View
              key={b.id || idx}
              style={[
                styles.dot,
                idx === activeIndex ? styles.dotActive : styles.dotIdle,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
  },
  card: {
    height: 224,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0E1117',
    justifyContent: 'flex-end',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(14, 17, 23, 0.62)',
  },
  content: {
    padding: spacing.lg,
    gap: 6,
  },
  badgePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 2,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: azColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  trustMicro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustMicroText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: azColors.primary,
  },
  dotIdle: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
});
