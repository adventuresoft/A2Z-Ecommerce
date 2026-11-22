import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Chip,
  Divider,
  List,
  Searchbar,
  Text,
} from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  resolveMediaUrl,
  useProductsPublicControllerGetSearchSuggestions,
} from '@repo/api-client';
import { env } from '@/shared/config/env';
import { analytics } from '@/shared/analytics';
import { usePreferencesStore } from '@/shared/stores/preferences-store';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { CatalogListingScreen } from '@/features/catalog/screens/catalog-listing-screen';

export function SearchScreen({ initialQuery = '' }: { initialQuery?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const recentSearches = usePreferencesStore((s) => s.recentSearches);
  const addRecentSearch = usePreferencesStore((s) => s.addRecentSearch);
  const removeRecentSearch = usePreferencesStore((s) => s.removeRecentSearch);
  const clearRecentSearches = usePreferencesStore((s) => s.clearRecentSearches);

  const [input, setInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(
    initialQuery.trim() ? initialQuery.trim() : null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const suggestionsQuery = useProductsPublicControllerGetSearchSuggestions(
    { q: debouncedQuery },
    {
      query: {
        enabled: debouncedQuery.length >= 2 && submittedQuery === null,
      },
    },
  );

  const submitSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    addRecentSearch(cleaned);
    analytics.track('search_performed', { query: cleaned });
    setInput(cleaned);
    setSubmittedQuery(cleaned);
  };

  if (submittedQuery) {
    return (
      <View style={styles.screen}>
        <View style={styles.submittedBar}>
          <Appbar.BackAction onPress={() => setSubmittedQuery(null)} />
          <Searchbar
            testID="search.activeInput"
            value={input}
            onChangeText={(text) => {
              setInput(text);
              if (text.trim() !== submittedQuery) {
                setSubmittedQuery(null);
              }
            }}
            onSubmitEditing={() => submitSearch(input)}
            placeholder={t('home.searchPlaceholder')}
            style={styles.searchbarInline}
          />
        </View>
        <View style={styles.resultsFlex}>
          <CatalogListingScreen title={submittedQuery} initialQuery={submittedQuery} />
        </View>
      </View>
    );
  }

  const productSuggestions = suggestionsQuery.data?.data?.products ?? [];
  const categorySuggestions = suggestionsQuery.data?.data?.categories ?? [];

  return (
    <View style={styles.screen} testID="search.screen">
      <View style={styles.topBar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Searchbar
          testID="search.input"
          autoFocus
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => submitSearch(input)}
          placeholder={t('home.searchPlaceholder')}
          style={styles.searchbarInline}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {debouncedQuery.length < 2 && recentSearches.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                {t('catalog.recentSearches')}
              </Text>
              <Button compact onPress={clearRecentSearches}>
                {t('catalog.clearAll')}
              </Button>
            </View>
            <View style={styles.chipsWrap}>
              {recentSearches.map((term) => (
                <Chip
                  key={term}
                  icon="history"
                  onPress={() => submitSearch(term)}
                  onClose={() => removeRecentSearch(term)}
                >
                  {term}
                </Chip>
              ))}
            </View>
          </View>
        ) : null}

        {debouncedQuery.length >= 2 ? (
          <>
            {categorySuggestions.length > 0 ? (
              <View style={styles.section}>
                <Text variant="labelLarge" style={styles.subHeader}>
                  {t('tabs.categories')}
                </Text>
                <View style={styles.chipsWrap}>
                  {categorySuggestions.map((cat) => (
                    <Chip
                      key={cat.id}
                      icon="tag-outline"
                      onPress={() =>
                        router.push({
                          pathname: '/category/[slug]',
                          params: { slug: cat.slug, name: cat.name },
                        } as never)
                      }
                    >
                      {cat.name}
                    </Chip>
                  ))}
                </View>
              </View>
            ) : null}

            {productSuggestions.length > 0 ? (
              <View style={styles.section}>
                <Text variant="labelLarge" style={styles.subHeader}>
                  {t('home.featured')}
                </Text>
                {productSuggestions.map((item) => {
                  const rawImg =
                    typeof item.image === 'string' ? item.image : null;
                  const resolved = resolveMediaUrl(rawImg, env.API_URL);
                  return (
                    <React.Fragment key={item.id}>
                      <Pressable
                        testID={`search.suggestion.${item.slug}`}
                        style={styles.suggestionRow}
                        onPress={() => {
                          addRecentSearch(item.title);
                          router.push(`/product/${item.slug}` as never);
                        }}
                      >
                        {resolved ? (
                          <Image
                            source={{ uri: resolved }}
                            style={styles.thumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.thumb, styles.thumbFallback]} />
                        )}
                        <View style={styles.suggestionText}>
                          <Text variant="bodyMedium" numberOfLines={1} style={styles.suggestionTitle}>
                            {item.title}
                          </Text>
                          <Text variant="labelSmall" style={styles.suggestionMeta}>
                            {item.category} • {formatBDT(item.price)}
                          </Text>
                        </View>
                      </Pressable>
                      <Divider />
                    </React.Fragment>
                  );
                })}
              </View>
            ) : null}

            <List.Item
              title={`Search all results for "${debouncedQuery}"`}
              left={(props) => <List.Icon {...props} icon="magnify" />}
              onPress={() => submitSearch(debouncedQuery)}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingRight: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: azColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  submittedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingRight: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: azColors.surface,
  },
  searchbarInline: {
    flex: 1,
    backgroundColor: azColors.page,
    elevation: 0,
    height: 44,
  },
  resultsFlex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  section: { gap: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontWeight: '700', color: azColors.navy },
  subHeader: { color: azColors.muted, marginBottom: spacing.xxs },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 56,
  },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  thumbFallback: { backgroundColor: azColors.border },
  suggestionText: { flex: 1, gap: 2 },
  suggestionTitle: { color: azColors.navy, fontWeight: '600' },
  suggestionMeta: { color: azColors.muted },
});
