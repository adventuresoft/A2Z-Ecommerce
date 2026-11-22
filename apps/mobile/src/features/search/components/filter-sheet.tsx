import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Modal, Portal, RadioButton, Switch, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { azColors, radius, spacing } from '@/shared/theme';

export type CatalogSortBy = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface CatalogFilterState {
  sortBy: CatalogSortBy;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  hasDiscount: boolean;
  brandSlug?: string;
}

export interface FacetBrandItem {
  id: string;
  name: string;
  slug: string;
}

interface FilterSheetProps {
  visible: boolean;
  initialState: CatalogFilterState;
  brands?: FacetBrandItem[];
  onDismiss: () => void;
  onApply: (next: CatalogFilterState) => void;
}

const SORT_OPTIONS: Array<{ value: CatalogSortBy; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export function FilterSheet({
  visible,
  initialState,
  brands = [],
  onDismiss,
  onApply,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CatalogFilterState>(initialState);
  const [minText, setMinText] = useState(initialState.minPrice?.toString() ?? '');
  const [maxText, setMaxText] = useState(initialState.maxPrice?.toString() ?? '');

  useEffect(() => {
    if (visible) {
      setDraft(initialState);
      setMinText(initialState.minPrice?.toString() ?? '');
      setMaxText(initialState.maxPrice?.toString() ?? '');
    }
  }, [visible, initialState]);

  const handleReset = () => {
    const clean: CatalogFilterState = {
      sortBy: 'featured',
      inStock: false,
      hasDiscount: false,
    };
    setDraft(clean);
    setMinText('');
    setMaxText('');
  };

  const handleApply = () => {
    const minNum = minText.trim() ? Number(minText) : undefined;
    const maxNum = maxText.trim() ? Number(maxText) : undefined;
    onApply({
      ...draft,
      minPrice: minNum && Number.isFinite(minNum) ? minNum : undefined,
      maxPrice: maxNum && Number.isFinite(maxNum) ? maxNum : undefined,
    });
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.sheet}
      >
        <Text variant="titleLarge" style={styles.heading}>
          {t('catalog.filters')} & {t('catalog.sort')}
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('catalog.sort')}
          </Text>
          <RadioButton.Group
            value={draft.sortBy}
            onValueChange={(val) => setDraft((prev) => ({ ...prev, sortBy: val as CatalogSortBy }))}
          >
            {SORT_OPTIONS.map((opt) => (
              <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </RadioButton.Group>

          <Divider style={styles.divider} />

          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('catalog.priceRange')}
          </Text>
          <View style={styles.priceInputs}>
            <TextInput
              testID="filter.minPriceInput"
              mode="outlined"
              label="Min BDT"
              keyboardType="numeric"
              value={minText}
              onChangeText={setMinText}
              style={styles.priceInput}
            />
            <TextInput
              testID="filter.maxPriceInput"
              mode="outlined"
              label="Max BDT"
              keyboardType="numeric"
              value={maxText}
              onChangeText={setMaxText}
              style={styles.priceInput}
            />
          </View>

          <View style={styles.switchRow}>
            <Text variant="bodyLarge">{t('catalog.inStock')}</Text>
            <Switch
              testID="filter.inStockSwitch"
              value={draft.inStock}
              onValueChange={(val) => setDraft((prev) => ({ ...prev, inStock: val }))}
            />
          </View>

          <View style={styles.switchRow}>
            <Text variant="bodyLarge">{t('catalog.onSale')}</Text>
            <Switch
              testID="filter.onSaleSwitch"
              value={draft.hasDiscount}
              onValueChange={(val) => setDraft((prev) => ({ ...prev, hasDiscount: val }))}
            />
          </View>

          {brands.length > 0 ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Brands
              </Text>
              <View style={styles.brandChips}>
                {brands.map((brand) => {
                  const selected = draft.brandSlug === brand.slug;
                  return (
                    <Chip
                      key={brand.id}
                      selected={selected}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          brandSlug: selected ? undefined : brand.slug,
                        }))
                      }
                    >
                      {brand.name}
                    </Chip>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="outlined" onPress={handleReset} style={styles.footerBtn}>
            {t('app.reset')}
          </Button>
          <Button
            testID="filter.applyButton"
            mode="contained"
            onPress={handleApply}
            style={styles.footerBtn}
          >
            {t('app.apply')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: azColors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    maxHeight: '85%',
  },
  heading: { color: azColors.navy, fontWeight: '700', marginBottom: spacing.sm },
  scroll: { marginBottom: spacing.md },
  sectionTitle: { color: azColors.navy, fontWeight: '700', marginBottom: spacing.xs },
  divider: { marginVertical: spacing.sm },
  priceInputs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  priceInput: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  brandChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1, borderRadius: radius.md },
});
