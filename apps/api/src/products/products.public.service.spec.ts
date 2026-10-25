import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';

describe('ProductsService - Public Methods', () => {
  let prismaMock: any;
  let service: ProductsService;

  beforeEach(() => {
    prismaMock = {
      product: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      category: {
        findMany: vi.fn(),
      },
    };
    service = new ProductsService(prismaMock);
  });

  describe('findPublicProducts', () => {
    it('should query active products with filters and calculate price and inStock', async () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'MacBook Pro 16',
        slug: 'macbook-pro-16',
        shortDescription: 'Pro laptop',
        isFeatured: true,
        createdAt: new Date(),
        category: { id: 'cat-1', name: 'Laptops', slug: 'laptops' },
        brand: { id: 'br-1', name: 'Apple', slug: 'apple', logoUrl: null },
        images: [
          { id: 'img-1', imageUrl: '/mac.jpg', altText: 'MacBook', isPrimary: true, sortOrder: 1 },
        ],
        variants: [
          {
            id: 'v-1',
            sku: 'MBP-1',
            regularPrice: 2500,
            salePrice: 2300,
            inventory: { quantity: 5, reservedQuantity: 1 },
          },
        ],
        reviews: [{ rating: 5 }, { rating: 4 }],
      };

      prismaMock.product.count.mockResolvedValue(1);
      prismaMock.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findPublicProducts({
        categorySlug: 'laptops',
        minPrice: 2000,
        inStock: true,
        page: 1,
        limit: 12,
      });

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      const item = result.items[0];
      expect(item.id).toBe('prod-1');
      expect(item.minPrice).toBe(2300);
      expect(item.maxPrice).toBe(2300);
      expect(item.regularPrice).toBe(2500);
      expect(item.salePrice).toBe(2300);
      expect(item.discountPercent).toBe(8);
      expect(item.inStock).toBe(true);
      expect(item.rating).toBe(4.5);
      expect(item.reviewsCount).toBe(2);
      expect(item.primaryImage?.imageUrl).toBe('/mac.jpg');
    });
  });

  describe('findPublicProductBySlug', () => {
    it('should return full product detail by slug with variants, attributes, reviews, and related products', async () => {
      const mockProduct = {
        id: 'prod-1',
        title: 'MacBook Pro 16',
        slug: 'macbook-pro-16',
        description: 'Detailed description',
        shortDescription: 'Short desc',
        isActive: true,
        isFeatured: true,
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Laptops', slug: 'laptops' },
        brand: { id: 'br-1', name: 'Apple', slug: 'apple', logoUrl: null },
        images: [
          { id: 'img-1', imageUrl: '/mac.jpg', altText: 'MacBook', isPrimary: true, sortOrder: 1 },
        ],
        variants: [
          {
            id: 'v-1',
            sku: 'MBP-1',
            barcode: '123456789',
            regularPrice: 2500,
            salePrice: 2300,
            weightGrams: 2000,
            imageUrl: '/mac-v1.jpg',
            inventory: { quantity: 10, reservedQuantity: 2 },
            attributes: [
              {
                attributeValue: {
                  value: 'Space Gray',
                  label: 'Space Gray',
                  colorCode: '#555555',
                  attribute: { name: 'Color', slug: 'color', type: 'COLOR' },
                },
              },
            ],
          },
        ],
        reviews: [
          {
            id: 'rev-1',
            rating: 5,
            title: 'Great machine',
            comment: 'Fast and reliable.',
            isVerifiedPurchase: true,
            createdAt: new Date(),
            user: { name: 'John Doe' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.product.findUnique.mockResolvedValue(mockProduct);
      prismaMock.product.findMany.mockResolvedValue([]); // related products

      const detail = await service.findPublicProductBySlug('macbook-pro-16');

      expect(detail.id).toBe('prod-1');
      expect(detail.slug).toBe('macbook-pro-16');
      expect(detail.variants.length).toBe(1);
      const v = detail.variants[0];
      expect(v.sku).toBe('MBP-1');
      expect(v.inStock).toBe(true);
      expect(v.stockQuantity).toBe(8);
      expect(v.attributes[0].value).toBe('Space Gray');
      expect(detail.reviews.length).toBe(1);
      expect(detail.reviews[0].reviewerName).toBe('John Doe');
    });

    it('should throw NotFoundException if product not found or inactive', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      await expect(service.findPublicProductBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty suggestions for empty query', async () => {
      const result = await service.getSearchSuggestions('');
      expect(result.products).toEqual([]);
      expect(result.categories).toEqual([]);
    });

    it('should return matching products and categories for non-empty query', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        {
          id: 'p-1',
          title: 'MacBook Pro',
          slug: 'macbook-pro',
          category: { name: 'Laptops' },
          images: [{ imageUrl: '/mac.jpg' }],
          variants: [{ regularPrice: 2000, salePrice: null }],
        },
      ]);
      prismaMock.category.findMany.mockResolvedValue([
        { id: 'c-1', name: 'Laptops', slug: 'laptops' },
      ]);

      const result = await service.getSearchSuggestions('macbook');
      expect(result.products.length).toBe(1);
      expect(result.products[0].title).toBe('MacBook Pro');
      expect(result.products[0].price).toBe(2000);
      expect(result.categories.length).toBe(1);
      expect(result.categories[0].name).toBe('Laptops');
    });
  });

  describe('getCuratedProducts', () => {
    it('should query and return flashDeals, featured, newArrivals, and bestSellers', async () => {
      const mockProduct = {
        id: 'p-1',
        title: 'MacBook Pro',
        slug: 'macbook-pro',
        shortDescription: 'Laptop',
        isFeatured: true,
        createdAt: new Date(),
        category: { id: 'c-1', name: 'Laptops', slug: 'laptops' },
        brand: { id: 'b-1', name: 'Apple', slug: 'apple', logoUrl: null },
        images: [{ id: 'img-1', imageUrl: '/mac.jpg', isPrimary: true, sortOrder: 1 }],
        variants: [
          {
            id: 'v-1',
            sku: 'MBP-1',
            isActive: true,
            regularPrice: 2000,
            salePrice: 1600,
            inventory: { quantity: 10, reservedQuantity: 0 },
          },
        ],
        reviews: [{ rating: 5 }],
      };

      prismaMock.product.findMany.mockResolvedValue([mockProduct]);
      prismaMock.orderItem = {
        groupBy: vi.fn().mockResolvedValue([]),
      };
      prismaMock.productVariant = {
        findMany: vi.fn().mockResolvedValue([]),
      };

      const result = await service.getCuratedProducts();

      expect(result.flashDeals.length).toBe(1);
      expect(result.flashDeals[0].discountPercent).toBe(20);
      expect(result.featured.length).toBe(1);
      expect(result.newArrivals.length).toBe(1);
      expect(result.bestSellers.length).toBe(1);
    });
  });
});
