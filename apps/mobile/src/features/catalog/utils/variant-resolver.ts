export interface VariantAttributeItem {
  attributeName: string;
  attributeType: 'TEXT' | 'COLOR' | 'BUTTON' | string;
  value: string;
  colorCode?: string | null;
}

export interface ResolvableVariant {
  id: string;
  sku: string;
  regularPrice: number;
  salePrice?: number | null;
  imageUrl?: string | null;
  inStock: boolean;
  stockQuantity: number;
  attributes: VariantAttributeItem[];
}

export interface AttributeOption {
  value: string;
  colorCode?: string | null;
  available: boolean;
}

export interface AttributeGroup {
  name: string;
  type: 'TEXT' | 'COLOR' | 'BUTTON' | string;
  options: AttributeOption[];
}

export type StockStatusKind = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function getEffectivePrice(variant: Pick<ResolvableVariant, 'regularPrice' | 'salePrice'>): number {
  if (
    variant.salePrice != null &&
    variant.salePrice > 0 &&
    variant.salePrice < variant.regularPrice
  ) {
    return variant.salePrice;
  }
  return variant.regularPrice;
}

export function getStockStatus(
  variant: Pick<ResolvableVariant, 'inStock' | 'stockQuantity'> | null | undefined,
  lowStockThreshold = 5,
): StockStatusKind {
  if (!variant || !variant.inStock || variant.stockQuantity <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (variant.stockQuantity <= lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

export function extractAttributeGroups(
  variants: ResolvableVariant[],
  selectedAttributes: Record<string, string>,
): AttributeGroup[] {
  const groupMap = new Map<
    string,
    { type: string; values: Map<string, string | null> }
  >();

  for (const variant of variants) {
    for (const attr of variant.attributes || []) {
      let entry = groupMap.get(attr.attributeName);
      if (!entry) {
        entry = { type: attr.attributeType, values: new Map() };
        groupMap.set(attr.attributeName, entry);
      }
      if (!entry.values.has(attr.value)) {
        entry.values.set(attr.value, attr.colorCode ?? null);
      }
    }
  }

  return Array.from(groupMap.entries()).map(([name, info]) => ({
    name,
    type: info.type,
    options: Array.from(info.values.entries()).map(([value, colorCode]) => {
      const candidateSelection = { ...selectedAttributes, [name]: value };
      const hasMatchingInStockVariant = variants.some((variant) => {
        if (!variant.inStock || variant.stockQuantity <= 0) return false;
        return Object.entries(candidateSelection).every(([k, v]) => {
          if (k !== name && !selectedAttributes[k]) return true;
          return variant.attributes.some(
            (a) => a.attributeName === k && a.value === v,
          );
        });
      });
      return {
        value,
        colorCode,
        available: hasMatchingInStockVariant,
      };
    }),
  }));
}

export function resolveSelectedVariant(
  variants: ResolvableVariant[],
  selectedAttributes: Record<string, string>,
): ResolvableVariant | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0] ?? null;

  const entries = Object.entries(selectedAttributes).filter(([, v]) => Boolean(v));
  if (entries.length === 0) {
    return variants.find((v) => v.inStock && v.stockQuantity > 0) ?? variants[0] ?? null;
  }

  const exact = variants.find((variant) =>
    entries.every(([k, v]) =>
      variant.attributes.some((a) => a.attributeName === k && a.value === v),
    ),
  );
  return exact ?? null;
}

export function getInitialVariantSelection(variants: ResolvableVariant[]): Record<string, string> {
  const preferred =
    variants.find((v) => v.inStock && v.stockQuantity > 0) ?? variants[0];
  if (!preferred) return {};
  const map: Record<string, string> = {};
  for (const attr of preferred.attributes || []) {
    map[attr.attributeName] = attr.value;
  }
  return map;
}
