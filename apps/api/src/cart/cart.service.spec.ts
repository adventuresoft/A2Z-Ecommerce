import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service.js';

describe('CartService', () => {
  let service: CartService;
  let prismaMock: any;

  const makeVariantRecord = (overrides: Record<string, any> = {}) => ({
    id: 'var-1',
    sku: 'SKU-001',
    regularPrice: 2500,
    salePrice: 2000,
    imageUrl: '/uploads/products/watch.webp',
    isActive: true,
    inventory: { quantity: 10, reservedQuantity: 2 },
    attributes: [{ attributeValue: { value: 'Black' } }, { attributeValue: { value: 'L' } }],
    product: {
      id: 'prod-1',
      title: 'Smart Watch',
      slug: 'smart-watch',
      isActive: true,
      deletedAt: null,
      thumbnailUrl: '/uploads/products/thumb.webp',
      images: [],
    },
    ...overrides,
  });

  beforeEach(() => {
    prismaMock = {
      cartItem: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      productVariant: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb: any) => cb(prismaMock)),
    };
    service = new CartService(prismaMock);
  });

  describe('CRUD & stock guardrails', () => {
    it('adds a new variant and calculates live pricing and totals', async () => {
      const variant = makeVariantRecord();
      prismaMock.productVariant.findUnique.mockResolvedValue(variant);
      prismaMock.cartItem.findUnique.mockResolvedValue(null);
      prismaMock.cartItem.findMany.mockResolvedValue([
        {
          id: 'ci-1',
          userId: 'u-1',
          variantId: 'var-1',
          quantity: 2,
          updatedAt: new Date(),
          variant,
        },
      ]);

      const cart = await service.addItem('u-1', { variantId: 'var-1', quantity: 2 });
      expect(prismaMock.cartItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { userId: 'u-1', variantId: 'var-1', quantity: 2 },
          update: { quantity: 2 },
        }),
      );
      expect(cart.totalItems).toBe(2);
      expect(cart.subtotal).toBe(4000);
      expect(cart.items[0].variantLabel).toBe('Black / L');
      expect(cart.items[0].availableQuantity).toBe(8);
    });

    it('increments existing cart item quantity and enforces available stock limit', async () => {
      const variant = makeVariantRecord({ inventory: { quantity: 5, reservedQuantity: 2 } }); // 3 available
      prismaMock.productVariant.findUnique.mockResolvedValue(variant);
      prismaMock.cartItem.findUnique.mockResolvedValue({ id: 'ci-1', quantity: 2 });

      await expect(
        service.addItem('u-1', { variantId: 'var-1', quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects adding an archived or nonexistent variant', async () => {
      prismaMock.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem('u-1', { variantId: 'missing', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('removes item when updated with quantity 0', async () => {
      prismaMock.cartItem.findMany.mockResolvedValue([]);
      const cart = await service.updateItem('u-1', 'var-1', { quantity: 0 });
      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', variantId: 'var-1' },
      });
      expect(cart.items).toEqual([]);
    });

    it('clears all cart items for the user', async () => {
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 3 });
      const res = await service.clearCart('u-1');
      expect(res).toEqual({ success: true, removedCount: 3 });
    });
  });

  describe('syncCart (guest -> authenticated merge)', () => {
    it('deduplicates guest items, caps merged quantity to stock, and reports skipped unavailable variants', async () => {
      const activeVariant = makeVariantRecord({
        id: 'var-1',
        inventory: { quantity: 5, reservedQuantity: 0 },
      });
      const oosVariant = makeVariantRecord({
        id: 'var-oos',
        inventory: { quantity: 2, reservedQuantity: 2 },
        product: { id: 'p-2', title: 'Out Of Stock Bag', slug: 'oos', isActive: true, deletedAt: null },
      });

      prismaMock.productVariant.findMany.mockResolvedValue([activeVariant, oosVariant]);
      prismaMock.cartItem.findMany
        .mockResolvedValueOnce([{ id: 'ci-1', userId: 'u-1', variantId: 'var-1', quantity: 3 }])
        .mockResolvedValueOnce([
          {
            id: 'ci-1',
            userId: 'u-1',
            variantId: 'var-1',
            quantity: 5,
            updatedAt: new Date(),
            variant: activeVariant,
          },
        ]);

      const res = await service.syncCart('u-1', {
        items: [
          { variantId: 'var-1', quantity: 2 },
          { variantId: 'var-1', quantity: 2 }, // duplicate guest entry -> guestQty=4, merged=3+4=7 -> capped at 5
          { variantId: 'var-oos', quantity: 1 },
          { variantId: 'var-deleted', quantity: 1 },
        ],
      });

      expect(prismaMock.cartItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { userId: 'u-1', variantId: 'var-1', quantity: 5 },
          update: { quantity: 5 },
        }),
      );
      expect(res.items).toHaveLength(1);
      expect(res.warnings).toHaveLength(3);
      expect(res.warnings?.map((w) => w.code)).toEqual(
        expect.arrayContaining(['QUANTITY_CAPPED', 'OUT_OF_STOCK', 'VARIANT_UNAVAILABLE']),
      );
    });
  });
});
