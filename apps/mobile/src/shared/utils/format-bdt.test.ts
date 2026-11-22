import { calculateDiscountPercent, formatBDT } from './format-bdt';

describe('formatBDT', () => {
  it('formats integers with BDT prefix and South Asian lakh/crore grouping', () => {
    expect(formatBDT(0)).toBe('BDT 0');
    expect(formatBDT(950)).toBe('BDT 950');
    expect(formatBDT(125000)).toBe('BDT 1,25,000');
    expect(formatBDT(1250000)).toBe('BDT 12,50,000');
  });

  it('preserves 2 decimals when fractional amount is non-zero', () => {
    expect(formatBDT(125000.5)).toBe('BDT 1,25,000.50');
    expect(formatBDT('1499.99')).toBe('BDT 1,499.99');
  });

  it('handles nullish or invalid inputs safely', () => {
    expect(formatBDT(null)).toBe('BDT 0');
    expect(formatBDT(undefined)).toBe('BDT 0');
    expect(formatBDT('invalid')).toBe('BDT 0');
  });

  it('calculates real discount percentages accurately', () => {
    expect(calculateDiscountPercent(2000, 1500)).toBe(25);
    expect(calculateDiscountPercent(2000, 2000)).toBeNull();
    expect(calculateDiscountPercent(2000, null)).toBeNull();
  });
});
