import {
  compareSemVer,
  createIdempotencyKey,
  isValidBdPhone,
  normalizeBdPhone,
} from './bd-phone';

describe('bd-phone & semver utils', () => {
  it('normalizes Bangladeshi phone numbers across formats', () => {
    expect(normalizeBdPhone('+8801707819647')).toBe('01707819647');
    expect(normalizeBdPhone('8801812345678')).toBe('01812345678');
    expect(normalizeBdPhone('01912-345-678')).toBe('01912345678');
    expect(normalizeBdPhone('1712345678')).toBe('01712345678');
  });

  it('validates BD operator prefixes (013-019)', () => {
    expect(isValidBdPhone('01707819647')).toBe(true);
    expect(isValidBdPhone('+8801312345678')).toBe(true);
    expect(isValidBdPhone('01112345678')).toBe(false);
    expect(isValidBdPhone('12345')).toBe(false);
  });

  it('creates RFC4122-formatted UUID v4 idempotency keys', () => {
    const k1 = createIdempotencyKey();
    const k2 = createIdempotencyKey();
    expect(k1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(k1).not.toBe(k2);
  });

  it('compares SemVer strings numerically', () => {
    expect(compareSemVer('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemVer('1.2.0', '1.10.0')).toBe(-1);
    expect(compareSemVer('2.0.0', '1.9.9')).toBe(1);
  });
});
