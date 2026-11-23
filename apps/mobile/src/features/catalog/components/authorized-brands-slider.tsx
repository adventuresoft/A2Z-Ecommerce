import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl, type PublicBrandDto } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { azColors, radius, spacing } from '@/shared/theme';

interface AuthorizedBrandsSliderProps {
  brands: PublicBrandDto[];
  eyebrow: string;
  title: string;
  warrantyBadge: string;
  onPressBrand: (brand: PublicBrandDto) => void;
}

function BrandSliderCard({
  brand,
  onPress,
}: {
  brand: PublicBrandDto;
  onPress: () => void;
}) {
  const rawLogoVal: unknown = brand.logoUrl;
  const rawLogo = typeof rawLogoVal === 'string' ? rawLogoVal : null;
  const logoUri = resolveMediaUrl(rawLogo, env.API_ORIGIN, 'original');
  const [logoFailed, setLogoFailed] = useState(false);

  const rawDescVal: unknown = brand.description;
  const rawDesc =
    typeof rawDescVal === 'string' && rawDescVal.trim()
      ? rawDescVal.trim()
      : 'Official Partner Brand';

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={brand.name}>
      <Surface style={styles.brandCard} elevation={1}>
        <View style={styles.logoFrame}>
          {logoUri && !logoFailed ? (
            <Image
              source={{ uri: logoUri }}
              contentFit="contain"
              cachePolicy="memory-disk"
              style={styles.logoImg}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <Text style={styles.brandWordmark} numberOfLines={1}>
              {brand.name.toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={styles.brandName} numberOfLines={1}>
          {brand.name}
        </Text>
        <Text style={styles.brandTagline} numberOfLines={1}>
          {rawDesc}
        </Text>
      </Surface>
    </Pressable>
  );
}

export function AuthorizedBrandsSlider({
  brands,
  eyebrow,
  title,
  warrantyBadge,
  onPressBrand,
}: AuthorizedBrandsSliderProps) {
  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="home.authorizedBrands">
      <View style={styles.header}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <View style={styles.warrantyPill}>
          <MaterialCommunityIcons name="certificate-outline" size={15} color="#059669" />
          <Text style={styles.warrantyText}>{warrantyBadge}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {brands.map((brand) => (
          <BrandSliderCard
            key={brand.id}
            brand={brand}
            onPress={() => onPressBrand(brand)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    backgroundColor: azColors.surface,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: azColors.border,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: azColors.primarySoft,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  eyebrowText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: azColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: azColors.navy,
    fontWeight: '800',
  },
  warrantyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    marginTop: 2,
  },
  warrantyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  rail: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  brandCard: {
    width: 136,
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: azColors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  logoFrame: {
    width: 96,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandWordmark: {
    fontSize: 15,
    fontWeight: '900',
    color: azColors.navy,
    letterSpacing: 1.2,
  },
  brandName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: azColors.navy,
  },
  brandTagline: {
    fontSize: 10,
    color: azColors.muted,
    textAlign: 'center',
  },
});
