/**
 * Formats monetary values using approved AZ Mobile standard:
 * - Prefix: "BDT "
 * - Numerals: English digits (0-9) in both EN & BN locales
 * - Grouping: South Asian lakh/crore grouping (e.g., BDT 1,25,000)
 */
export function formatBDT(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const hasFraction = Math.abs(safe % 1) > 0.001;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(safe);

  return `BDT ${formatted}`;
}

export function calculateDiscountPercent(
  regularPrice: number,
  salePrice?: number | null,
): number | null {
  if (salePrice == null || salePrice <= 0 || regularPrice <= 0 || salePrice >= regularPrice) {
    return null;
  }
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}
