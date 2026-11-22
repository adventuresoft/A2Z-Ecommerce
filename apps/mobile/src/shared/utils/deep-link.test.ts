import { resolveSafeInternalRoute } from './deep-link';

describe('resolveSafeInternalRoute', () => {
  it('resolves valid relative, custom-scheme, and allowlisted universal links', () => {
    expect(resolveSafeInternalRoute('/orders/ord_123')).toBe('/orders/ord_123');
    expect(resolveSafeInternalRoute('azecommerce://product/wireless-earbuds')).toBe(
      '/product/wireless-earbuds',
    );
    expect(
      resolveSafeInternalRoute('https://atozecommerce.com/track/TRK-9001'),
    ).toBe('/track/TRK-9001');
    expect(
      resolveSafeInternalRoute(
        'azecommerce://checkout/payment-callback?invoice_number=INV-100',
      ),
    ).toBe('/checkout/payment-callback?invoice_number=INV-100');
  });

  it('rejects external phishing domains, traversal attempts, and invalid characters', () => {
    expect(resolveSafeInternalRoute('https://evil.example.com/orders/1')).toBeNull();
    expect(resolveSafeInternalRoute('/orders/../../admin')).toBeNull();
    expect(resolveSafeInternalRoute('javascript:alert(1)')).toBeNull();
    expect(resolveSafeInternalRoute('/product/<script>')).toBeNull();
    expect(resolveSafeInternalRoute('')).toBeNull();
    expect(resolveSafeInternalRoute(null)).toBeNull();
  });
});
