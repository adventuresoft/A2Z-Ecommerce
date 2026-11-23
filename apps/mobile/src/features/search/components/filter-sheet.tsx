import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Divider,
  Modal,
  Portal,
  RadioButton,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { azColors, radius, spacing } from '@/shared/theme';

export type CatalogSortBy = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface CatalogFilterState {
  sortBy: CatalogSortBy;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  hasDiscount: boolean;
  brandSlugs: string[];
  attributeValues: string[];
  categorySlug?: string;
}

export interface FacetBrandItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface FacetCategoryItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface FacetAttributeValueItem {
  id: string;
  value: string;
  label?: string | null;
  colorCode?: string | null;
  count?: number;
}

export interface FacetAttributeItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: FacetAttributeValueItem[];
}

interface FilterSheetProps {
  visible: boolean;
  initialState: CatalogFilterState;
  brands?: FacetBrandItem[];
  attributes?: FacetAttributeItem[];
  categories?: FacetCategoryItem[];
  hideCategories?: boolean;
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
  attributes = [],
  categories = [],
  hideCategories = false,
  onDismiss,
  onApply,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CatalogFilterState>(initialState);
  const [minText, setMinText] = useState(initialState.minPrice?.toString() ?? '');
  const [maxText, setMaxText] = useState(initialState.maxPrice?.toString() ?? '');

  useEffect(() => {
    if (visible) {
      setDraft({
        ...initialState,
        brandSlugs: [...initialState.brandSlugs],
        attributeValues: [...initialState.attributeValues],
      });
      setMinText(initialState.minPrice?.toString() ?? '');
      setMaxText(initialState.maxPrice?.toString() ?? '');
    }
  }, [visible, initialState]);

  const toggleBrand = (slug: string) => {
    setDraft((prev) => {
      const exists = prev.brandSlugs.includes(slug);
      return {
        ...prev,
        brandSlugs: exists
          ? prev.brandSlugs.filter((s) => s !== slug)
          : [...prev.brandSlugs, slug],
      };
    });
  };

  const toggleAttributeValue = (valId: string) => {
    setDraft((prev) => {
      const exists = prev.attributeValues.includes(valId);
      return {
        ...prev,
        attributeValues: exists
          ? prev.attributeValues.filter((id) => id !== valId)
          : [...prev.attributeValues, valId],
      };
    });
  };

  const handleReset = () => {
    const clean: CatalogFilterState = {
      sortBy: 'featured',
      inStock: false,
      hasDiscount: false,
      brandSlugs: [],
      attributeValues: [],
      categorySlug: undefined,
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
      minPrice: minNum !== undefined && Number.isFinite(minNum) ? minNum : undefined,
      maxPrice: maxNum !== undefined && Number.isFinite(maxNum) ? maxNum : undefined,
    });
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.sheet}>
        <Text variant="titleLarge" style={styles.heading}>
          {t('catalog.filters')} & {t('catalog.sort')}
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('catalog.sort')}
          </Text>
          <RadioButton.Group
            value={draft.sortBy}
            onValueChange={(val) =>
              setDraft((prev) => ({ ...prev, sortBy: val as CatalogSortBy }))
            }
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

          {!hideCategories && categories.length > 0 ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Categories
              </Text>
              <View style={styles.chipsWrap}>
                {categories.map((cat) => {
                  const selected = draft.categorySlug === cat.slug;
                  return (
                    <Chip
                      key={cat.id}
                      selected={selected}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          categorySlug: selected ? undefined : cat.slug,
                        }))
                      }
                    >
                      {cat.count != null ? `${cat.name} (${cat.count})` : cat.name}
                    </Chip>
                  );
                })}
              </View>
            </>
          ) : null}

          {brands.length > 0 ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Brands
              </Text>
              <View style={styles.chipsWrap}>
                {brands.map((brand) => {
                  const selected = draft.brandSlugs.includes(brand.slug);
                  return (
                    <Chip
                      key={brand.id}
                      selected={selected}
                      onPress={() => toggleBrand(brand.slug)}
                    >
                      {brand.count != null ? `${brand.name} (${brand.count})` : brand.name}
                    </Chip>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Dynamic Faceted Attributes matching Web ProductCatalogView (OR within group, AND across groups) */}
          {attributes.map((attr) => {
            if (!attr.values || attr.values.length === 0) return null;
            const isColor = attr.type?.toUpperCase() === 'COLOR';
            return (
              <React.Fragment key={attr.id}>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  {attr.name}
                </Text>
                <View style={styles.chipsWrap}>
                  {attr.values.map((val) => {
                    const selected = draft.attributeValues.includes(val.id);
                    const displayLabel = val.label?.trim() || val.value;
                    if (isColor && val.colorCode) {
                      return (
                        <Pressable
                          key={val.id}
                          onPress={() => toggleAttributeValue(val.id)}
                          style={[
                            styles.colorChip,
                            selected && styles.colorChipSelected,
                          ]}
                        >
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: val.colorCode },
                            ]}
                          />
                          <Text
                            style={[
                              styles.colorLabel,
                              selected && styles.colorLabelSelected,
                            ]}
                          >
                            {val.count != null ? `${displayLabel} (${val.count})` : displayLabel}
                          </Text>
                        </Pressable>
                      );
                    }
                    return (
                      <Chip
                        key={val.id}
                        selected={selected}
                        onPress={() => toggleAttributeValue(val.id)}
                      >
                        {val.count != null ? `${displayLabel} (${val.count})` : displayLabel}
                      </Chip>
                    );
                  })}
                </View>
              </React.Fragment>
            );
          })}
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
    maxHeight: '86%',
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
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: azColors.border,
    backgroundColor: azColors.page,
  },
  colorChipSelected: {
    borderColor: azColors.primary,
    backgroundColor: azColors.primarySoft,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.2)',
  },
  colorLabel: {
    fontSize: 12.5,
    color: azColors.navy,
    fontWeight: '500',
  },
  colorLabelSelected: {
    color: azColors.primary,
    fontWeight: '700',
  },
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1, borderRadius: radius.md },
});
