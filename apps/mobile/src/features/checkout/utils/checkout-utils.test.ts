import {
  buildCheckoutFingerprint,
  generateIdempotencyKey,
  mapAddressToOrderDto,
  normalizePaymentMethodCode,
  parsePaystationCallbackUrl,
} from './checkout-utils';

describe('checkout-utils', () => {
  it('generates valid UUID v4 idempotency keys', () => {
    const k1 = generateIdempotencyKey();
    const k2 = generateIdempotencyKey();
    expect(k1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(k1).not.toBe(k2);
  });

  it('produces deterministic fingerprints regardless of item order', () => {
    const fp1 = buildCheckoutFingerprint({
      items: [
        { variantId: 'b', quantity: 1 },
        { variantId: 'a', quantity: 2 },
      ],
      addressId: 'addr-1',
      shippingMethodId: 'ship-1',
      paymentMethod: 'COD',
      couponCode: 'save10',
    });
    const fp2 = buildCheckoutFingerprint({
      items: [
        { variantId: 'a', quantity: 2 },
        { variantId: 'b', quantity: 1 },
      ],
      addressId: 'addr-1',
      shippingMethodId: 'ship-1',
      paymentMethod: 'COD',
      couponCode: 'SAVE10',
    });
    expect(fp1).toBe(fp2);
  });

  it('parses PayStation redirect callback URL parameters safely', () => {
    const parsed = parsePaystationCallbackUrl(
      'azecommerce://checkout/payment-callback?status=Successful&invoice_number=INV-2026-001&trx_id=TRX9988',
    );
    expect(parsed).toEqual({
      invoiceNumber: 'INV-2026-001',
      trxId: 'TRX9988',
      rawStatus: 'Successful',
    });
  });

  it('maps UserAddressResponseDto into CreateOrderDto with numeric BD location IDs', () => {
    const dto = mapAddressToOrderDto({
      address: {
        id: 'a-1',
        userId: 'u-1',
        recipientName: 'Nadia Rahman',
        phone: '01707819647',
        streetAddress: 'House 12, Road 4, Dhanmondi',
        city: 'Dhaka',
        state: 'Dhaka' as unknown as Record<string, unknown>,
        thana: 'Dhanmondi' as unknown as Record<string, unknown>,
        divisionId: 1 as unknown as Record<string, unknown>,
        districtId: 10 as unknown as Record<string, unknown>,
        thanaId: 100 as unknown as Record<string, unknown>,
        postalCode: '1209',
        country: 'Bangladesh',
        isDefaultShipping: true,
        isDefaultBilling: false,
        createdAt: '',
        updatedAt: '',
      },
      items: [{ variantId: 'v-1', quantity: 2 }],
      paymentMethod: normalizePaymentMethodCode('paystation'),
      couponCode: 'WELCOME10',
    });

    expect(dto.shippingDivisionId).toBe(1);
    expect(dto.shippingDistrictId).toBe(10);
    expect(dto.shippingThanaId).toBe(100);
    expect(dto.paymentMethod).toBe('PAYSTATION');
    expect(dto.shippingPostalCode).toBe('1209');
  });
});
