import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from './products.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { TagsService } from '../tags/tags.service.js';

describe('ProductsService Tags Integration', () => {
  let service: ProductsService;
  let mockPrisma: any;
  let mockTagsService: any;

  beforeEach(() => {
    mockPrisma = {
      category: {
        findUnique: vi.fn(),
      },
      brand: {
        findUnique: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      inventory: {
        create: vi.fn(),
      },
      productTag: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      attributeValue: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    };

    mockTagsService = {
      resolveOrCreateTags: vi.fn(),
    };

    service = new ProductsService(
      mockPrisma as unknown as PrismaService,
      mockTagsService as unknown as TagsService,
    );
  });

  describe('create with tags', () => {
    it('should resolve tags and create ProductTag links in transaction', async () => {
      mockPrisma.category.findUnique.mockResolvedValueOnce({ id: 'cat-1' });
      mockPrisma.product.findUnique.mockResolvedValueOnce(null); // slug check
      mockPrisma.productVariant.findUnique.mockResolvedValueOnce(null); // sku check

      const createdProductRecord = {
        id: 'prod-123',
        title: 'Tagged Product',
        slug: 'tagged-product',
        description: 'Test description',
        shortDescription: null,
        thumbnailUrl: null,
        categoryId: 'cat-1',
        brandId: null,
        isFeatured: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.product.create.mockResolvedValueOnce(createdProductRecord);
      mockPrisma.productVariant.create.mockResolvedValueOnce({ id: 'var-1' });
      mockPrisma.inventory.create.mockResolvedValueOnce({ id: 'inv-1' });

      mockTagsService.resolveOrCreateTags.mockResolvedValueOnce([
        'tag-uuid-1',
        'tag-uuid-2',
      ]);

      mockPrisma.product.findUniqueOrThrow.mockResolvedValueOnce({
        ...createdProductRecord,
        category: { id: 'cat-1', name: 'Cat 1', slug: 'cat-1' },
        brand: null,
        images: [],
        variants: [
          {
            id: 'var-1',
            sku: 'TAGGED-001',
            regularPrice: 20,
            salePrice: null,
            weightGrams: null,
            image: null,
            isActive: true,
            attributes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        tags: [
          {
            tag: {
              id: 'tag-uuid-1',
              name: 'Tag 1',
              slug: 'tag-1',
              colorCode: '#000',
            },
          },
          {
            tag: {
              id: 'tag-uuid-2',
              name: 'Tag 2',
              slug: 'tag-2',
              colorCode: '#fff',
            },
          },
        ],
      });

      const result = await service.create({
        title: 'Tagged Product',
        description: 'Test description',
        categoryId: 'cat-1',
        tagIds: ['tag-uuid-1'],
        tags: ['New Tag Name'],
      });

      expect(mockTagsService.resolveOrCreateTags).toHaveBeenCalledWith(
        ['tag-uuid-1'],
        ['New Tag Name'],
        expect.anything(),
      );

      expect(mockPrisma.productTag.createMany).toHaveBeenCalledWith({
        data: [
          { productId: 'prod-123', tagId: 'tag-uuid-1' },
          { productId: 'prod-123', tagId: 'tag-uuid-2' },
        ],
      });

      expect(result.tags.length).toBe(2);
      expect(result.tags[0].name).toBe('Tag 1');
      expect(result.tags[1].name).toBe('Tag 2');
    });
  });

  describe('update with tags', () => {
    it('should replace previous tag associations with new resolved tags', async () => {
      mockPrisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-123',
        slug: 'tagged-product',
        categoryId: 'cat-1',
        brandId: null,
      });

      mockTagsService.resolveOrCreateTags.mockResolvedValueOnce(['tag-new-1']);

      mockPrisma.product.update.mockResolvedValueOnce({});
      mockPrisma.product.findFirst.mockResolvedValueOnce({
        id: 'prod-123',
        title: 'Updated Product',
        slug: 'tagged-product',
        description: 'Updated desc',
        shortDescription: null,
        thumbnailUrl: null,
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Cat 1', slug: 'cat-1' },
        brandId: null,
        brand: null,
        isFeatured: false,
        isActive: true,
        images: [],
        variants: [],
        tags: [
          {
            tag: {
              id: 'tag-new-1',
              name: 'Tag New',
              slug: 'tag-new',
              colorCode: null,
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('prod-123', {
        tags: ['Tag New'],
      });

      expect(mockPrisma.productTag.deleteMany).toHaveBeenCalledWith({
        where: { productId: 'prod-123' },
      });
      expect(mockPrisma.productTag.createMany).toHaveBeenCalledWith({
        data: [{ productId: 'prod-123', tagId: 'tag-new-1' }],
      });
      expect(result.tags.length).toBe(1);
      expect(result.tags[0].slug).toBe('tag-new');
    });
  });

  describe('findAll filtering by tag', () => {
    it('should build tag filter where condition when tagId is passed', async () => {
      mockPrisma.product.count.mockResolvedValueOnce(1);
      mockPrisma.product.findMany.mockResolvedValueOnce([]);

      await service.findAll({
        tagId: 'tag-filter-1',
      });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: { tagId: 'tag-filter-1' },
            },
          }),
        }),
      );
    });
  });
});
