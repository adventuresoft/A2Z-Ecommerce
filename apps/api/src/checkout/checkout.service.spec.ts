import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { CheckoutService } from './checkout.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CouponsService } from '../coupons/coupons.service.js';
import type { TaxesService } from '../taxes/taxes.service.js';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let mockPrisma: any;
  let mockCouponsService: any;
  let mockTaxesService: any;

  beforeEach(() => {
    mockPrisma = {
      productVariant: {
        findMany: vi.fn(),
      },
      shippingMethod: {
        findUnique: vi.fn(),
      },
    };

    mockCouponsService = {
      validateAndCalculateDiscount: vi.fn(),
    };

    mockTaxesService = {
      resolveEffectiveTaxClass: vi.fn().mockResolvedValue({
        taxRate: 5,
        taxClassName: 'Standard Electronics VAT',
      }),
      calculateLineItemTax: vi.fn().mockImplementation((price, qty, rate, name) => {
        const net = price / (1 + rate / 100);
        const unitTax = price - net;
        return {
          unitPrice: price,
          quantity: qty,
          totalTax: Number((unitTax * qty).toFixed(2)),
          taxRate: rate,
          taxClassName: name,
        };
      }),
    };

    service = new CheckoutService(
      mockPrisma as unknown as PrismaService,
      mockCouponsService as unknown as CouponsService,
      mockTaxesService as unknown as TaxesService,
    );
  });

  it('throws BadRequestException if items array is empty', async () => {
    await expect(
      service.calculateCheckout({ items: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates totals with in-stock items and Dhaka delivery fee', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'var-1',
        sku: 'MBP-1',
        regularPrice: new Prisma.Decimal(3000),
        salePrice: new Prisma.Decimal(2500),
        isActive: true,
        productId: 'prod-1',
        product: { id: 'prod-1', title: 'MacBook Pro', isActive: true, categoryId: 'cat-1' },
        inventory: { quantity: 10, reservedQuantity: 2 }, // 8 available
      },
    ]);

    const result = await service.calculateCheckout({
      items: [{ variantId: 'var-1', quantity: 2 }],
      shippingCity: 'Dhaka',
    });

    expect(result.subtotal).toBe(5000); // 2500 * 2
    expect(result.shippingFee).toBe(60); // Inside Dhaka
    expect(result.discountAmount).toBe(0);
    expect(result.grandTotal).toBe(5060);
    expect(result.isEligibleForCheckout).toBe(true);
    expect(result.itemsValidation[0].isValid).toBe(true);
  });

  it('marks isEligibleForCheckout as false if item is out of stock', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'var-1',
        sku: 'MBP-1',
        regularPrice: new Prisma.Decimal(3000),
        salePrice: null,
        isActive: true,
        productId: 'prod-1',
        product: { id: 'prod-1', title: 'MacBook Pro', isActive: true, categoryId: 'cat-1' },
        inventory: { quantity: 5, reservedQuantity: 5 }, // 0 available
      },
    ]);

    const result = await service.calculateCheckout({
      items: [{ variantId: 'var-1', quantity: 1 }],
      shippingCity: 'Chittagong',
    });

    expect(result.isEligibleForCheckout).toBe(false);
    expect(result.itemsValidation[0].isValid).toBe(false);
    expect(result.shippingFee).toBe(120); // Outside Dhaka
  });

  it('applies free shipping when subtotal >= 100,000', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'var-high',
        sku: 'MAC-PRO',
        regularPrice: new Prisma.Decimal(120000),
        salePrice: null,
        isActive: true,
        productId: 'prod-1',
        product: { id: 'prod-1', title: 'Mac Pro', isActive: true, categoryId: 'cat-1' },
        inventory: { quantity: 5, reservedQuantity: 0 },
      },
    ]);

    const result = await service.calculateCheckout({
      items: [{ variantId: 'var-high', quantity: 1 }],
      shippingCity: 'Sylhet',
    });

    expect(result.subtotal).toBe(120000);
    expect(result.shippingFee).toBe(0); // Free shipping threshold
    expect(result.grandTotal).toBe(120000);
  });

  it('applies validated coupon discount to calculation', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'var-1',
        sku: 'PHONE-1',
        regularPrice: new Prisma.Decimal(10000),
        salePrice: null,
        isActive: true,
        productId: 'prod-1',
        product: { id: 'prod-1', title: 'Smartphone', isActive: true, categoryId: 'cat-1' },
        inventory: { quantity: 5, reservedQuantity: 0 },
      },
    ]);

    mockCouponsService.validateAndCalculateDiscount.mockResolvedValue({
      coupon: {
        code: 'AZDEAL',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(500),
        description: '৳500 OFF',
      },
      discountAmount: 500,
    });

    const result = await service.calculateCheckout({
      items: [{ variantId: 'var-1', quantity: 1 }],
      shippingCity: 'Dhaka',
      couponCode: 'AZDEAL',
    });

    expect(result.subtotal).toBe(10000);
    expect(result.discountAmount).toBe(500);
    expect(result.shippingFee).toBe(60);
    expect(result.grandTotal).toBe(9560); // 10000 - 500 + 60
    expect(result.coupon?.code).toBe('AZDEAL');
  });
});
