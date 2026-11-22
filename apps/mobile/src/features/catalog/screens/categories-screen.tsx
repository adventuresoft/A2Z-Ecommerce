import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, List, Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesPublicControllerGetTree, resolveMediaUrl } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { EmptyState } from '@/shared/components/empty-state';
import { ProductGridSkeleton } from '@/shared/components/skeleton';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  children?: CategoryNode[];
}

export function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/v1/categories/tree'],
    queryFn: () => categoriesPublicControllerGetTree(),
    staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS,
  });

  const tree = (data?.data ?? []) as unknown as CategoryNode[];

  return (
    <View style={styles.screen} testID="categories.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={t('tabs.categories')} />
        <Appbar.Action icon="magnify" onPress={() => router.push('/search' as never)} />
      </Appbar.Header>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : tree.length === 0 ? (
        <EmptyState icon="view-grid-outline" title={t('catalog.noProducts')} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {tree.map((root) => {
            const uri = resolveMediaUrl(root.imageUrl, env.API_ORIGIN, 'thumb');
            return (
              <Surface key={root.id} style={styles.card} elevation={1}>
                <Pressable
                  style={styles.rootRow}
                  onPress={() => router.push(`/category/${root.slug}` as never)}
                >
                  <View style={styles.thumb}>
                    {uri ? (
                      <Image source={{ uri }} contentFit="cover" style={styles.thumbImg} />
                    ) : (
                      <Text style={styles.initial}>{root.name.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.rootTextWrap}>
                    <Text variant="titleMedium" style={styles.rootTitle}>
                      {root.name}
                    </Text>
                    {root.children && root.children.length > 0 ? (
                      <Text variant="bodySmall" style={styles.subCount}>
                        {root.children.length} subcategories
                      </Text>
                    ) : null}
                  </View>
                  <List.Icon icon="chevron-right" color={azColors.muted} />
                </Pressable>

                {root.children && root.children.length > 0 ? (
                  <View style={styles.childrenWrap}>
                    {root.children.map((child) => (
                      <Pressable
                        key={child.id}
                        style={styles.childChip}
                        onPress={() => router.push(`/category/${child.slug}` as never)}
                      >
                        <Text style={styles.childText}>{child.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Surface>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: azColors.border,
    overflow: 'hidden',
  },
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: azColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  initial: { fontSize: 18, fontWeight: '700', color: azColors.primary },
  rootTextWrap: { flex: 1 },
  rootTitle: { color: azColors.navy, fontWeight: '700' },
  subCount: { color: azColors.muted },
  childrenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  childChip: {
    backgroundColor: azColors.page,
    borderWidth: 1,
    borderColor: azColors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  childText: { fontSize: 12, color: azColors.navy, fontWeight: '500' },
});
