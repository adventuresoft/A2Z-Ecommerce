import {
  extractAttributeGroups,
  getEffectivePrice,
  getInitialVariantSelection,
  getStockStatus,
  resolveSelectedVariant,
  type ResolvableVariant,
} from './variant-resolver';

const VARIANTS: ResolvableVariant[] = [
  {
    id: 'v-black-m',
    sku: 'TEE-BLK-M',
    regularPrice: 1200,
    salePrice: 950,
    inStock: true,
    stockQuantity: 12,
    attributes: [
      { attributeName: 'Color', attributeType: 'COLOR', value: 'Black', colorCode: '#000000' },
      { attributeName: 'Size', attributeType: 'BUTTON', value: 'M' },
    ],
  },
  {
    id: 'v-black-l',
    sku: 'TEE-BLK-L',
    regularPrice: 1200,
    salePrice: null,
    inStock: true,
    stockQuantity: 3,
    attributes: [
      { attributeName: 'Color', attributeType: 'COLOR', value: 'Black', colorCode: '#000000' },
      { attributeName: 'Size', attributeType: 'BUTTON', value: 'L' },
    ],
  },
  {
    id: 'v-blue-m',
    sku: 'TEE-BLU-M',
    regularPrice: 1200,
    salePrice: 950,
    inStock: false,
    stockQuantity: 0,
    attributes: [
      { attributeName: 'Color', attributeType: 'COLOR', value: 'Blue', colorCode: '#1D4ED8' },
      { attributeName: 'Size', attributeType: 'BUTTON', value: 'M' },
    ],
  },
];

describe('variant-resolver', () => {
  it('picks the first in-stock variant for initial selection', () => {
    expect(getInitialVariantSelection(VARIANTS)).toEqual({ Color: 'Black', Size: 'M' });
  });

  it('extracts attribute groups and marks out-of-stock combinations unavailable', () => {
    const groups = extractAttributeGroups(VARIANTS, { Color: 'Black', Size: 'M' });
    const colorGroup = groups.find((g) => g.name === 'Color')!;
    expect(colorGroup.options.find((o) => o.value === 'Black')?.available).toBe(true);
    expect(colorGroup.options.find((o) => o.value === 'Blue')?.available).toBe(false);
  });

  it('resolves exact matching variant, effective price, and stock status', () => {
    const blackL = resolveSelectedVariant(VARIANTS, { Color: 'Black', Size: 'L' });
    expect(blackL?.id).toBe('v-black-l');
    expect(getEffectivePrice(blackL!)).toBe(1200);
    expect(getStockStatus(blackL)).toBe('LOW_STOCK');

    const blueM = resolveSelectedVariant(VARIANTS, { Color: 'Blue', Size: 'M' });
    expect(getEffectivePrice(blueM!)).toBe(950);
    expect(getStockStatus(blueM)).toBe('OUT_OF_STOCK');
  });
});
