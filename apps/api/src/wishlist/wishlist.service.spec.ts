import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WishlistService } from './wishlist.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('WishlistService', () => {
  let service: WishlistService;
  let mockPrisma: any;

  const sampleProductRecord = {
    id: 'c8a4d2e1-45b7-4c8d-91ef-7b6a5e123456',
    title: 'Apple MacBook Pro 16 M3 Max',
    slug: 'apple-macbook-pro-16-m3-max',
    shortDescription: 'Flagship Apple Silicon laptop',
    isActive: true,
    isFeatured: true,
    thumbnailUrl: 'https://example.com/mbp.jpg',
    category: { id: 'cat-1', name: 'Laptops', slug: 'laptops' },
    brand: { id: 'brand-1', name: 'Apple', slug: 'apple' },
    images: [{ imageUrl: 'https://example.com/mbp-primary.jpg' }],
    variants: [
      {
        id: 'var-1',
        sku: 'MBP16-M3MAX',
        isActive: true,
        regularPrice: new Prisma.Decimal(349000),
        salePrice: new Prisma.Decimal(315000),
        inventory: { quantity: 10, reservedQuantity: 2 },
      },
    ],
    reviews: [{ rating: 5 }, { rating: 4 }],
  };

  beforeEach(() => {
    mockPrisma = {
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      wishlistItem: {
        findMany: vi.fn(),
        upsert: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    service = new WishlistService(mockPrisma as unknown as PrismaService);
  });

  it('returns formatted wishlist items with stock and discount calculations', async () => {
    mockPrisma.wishlistItem.findMany.mockResolvedValue([
      {
        id: 'wl-1',
        userId: 'user-1',
        productId: sampleProductRecord.id,
        createdAt: new Date('2026-10-25T10:00:00Z'),
        product: sampleProductRecord,
      },
    ]);

    const items = await service.getCustomerWishlist('user-1');
    expect(items).toHaveLength(1);
    expect(items[0].product.title).toBe('Apple MacBook Pro 16 M3 Max');
    expect(items[0].product.effectivePrice).toBe(315000);
    expect(items[0].product.regularPrice).toBe(349000);
    expect(items[0].product.discountPercent).toBe(10);
    expect(items[0].product.inStock).toBe(true);
    expect(items[0].product.availableQuantity).toBe(8);
    expect(items[0].product.isUnavailable).toBe(false);
    expect(items[0].product.rating).toBe(4.5);
  });

  it('flags deactivated or variant-less products as isUnavailable', async () => {
    mockPrisma.wishlistItem.findMany.mockResolvedValue([
      {
        id: 'wl-2',
        userId: 'user-1',
        productId: sampleProductRecord.id,
        createdAt: new Date('2026-10-25T10:00:00Z'),
        product: {
          ...sampleProductRecord,
          isActive: false,
        },
      },
    ]);

    const items = await service.getCustomerWishlist('user-1');
    expect(items[0].product.isUnavailable).toBe(true);
    expect(items[0].product.inStock).toBe(false);
  });

  it('adds a product idempotently via upsert and throws NotFoundException for unknown product', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(
      service.addProduct('user-1', 'non-existent-slug'),
    ).rejects.toThrow(NotFoundException);

    mockPrisma.product.findUnique.mockResolvedValueOnce({
      id: sampleProductRecord.id,
    });
    mockPrisma.wishlistItem.upsert.mockResolvedValue({});
    mockPrisma.wishlistItem.findUniqueOrThrow.mockResolvedValue({
      id: 'wl-1',
      userId: 'user-1',
      productId: sampleProductRecord.id,
      createdAt: new Date(),
      product: sampleProductRecord,
    });

    const added = await service.addProduct('user-1', sampleProductRecord.id);
    expect(added.productId).toBe(sampleProductRecord.id);
    expect(mockPrisma.wishlistItem.upsert).toHaveBeenCalledWith({
      where: {
        userId_productId: {
          userId: 'user-1',
          productId: sampleProductRecord.id,
        },
      },
      update: {},
      create: {
        userId: 'user-1',
        productId: sampleProductRecord.id,
      },
    });
  });

  it('merges valid guest product IDs and ignores invalid/mock IDs during syncGuestWishlist', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: sampleProductRecord.id },
    ]);
    mockPrisma.wishlistItem.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.wishlistItem.findMany.mockResolvedValue([
      {
        id: 'wl-1',
        userId: 'user-1',
        productId: sampleProductRecord.id,
        createdAt: new Date(),
        product: sampleProductRecord,
      },
    ]);

    const synced = await service.syncGuestWishlist('user-1', {
      productIds: [sampleProductRecord.id, 'fs-1', 'apple-macbook-pro-16-m3-max'],
    });

    expect(mockPrisma.wishlistItem.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-1', productId: sampleProductRecord.id }],
      skipDuplicates: true,
    });
    expect(synced).toHaveLength(1);
  });

  it('removes a product from wishlist idempotently', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: sampleProductRecord.id,
    });
    mockPrisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });

    const res = await service.removeProduct('user-1', sampleProductRecord.id);
    expect(res.success).toBe(true);
    expect(res.removedProductId).toBe(sampleProductRecord.id);
  });
});
