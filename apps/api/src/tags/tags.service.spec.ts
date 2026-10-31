import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('TagsService', () => {
  let service: TagsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      tag: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new TagsService(mockPrisma as unknown as PrismaService);
  });

  describe('slugify', () => {
    it('should convert strings to lowercase kebab-case', () => {
      expect(service.slugify('Summer Collection 2026')).toBe(
        'summer-collection-2026',
      );
      expect(service.slugify("Men's Trending Deals")).toBe(
        'mens-trending-deals',
      );
      expect(service.slugify('   Super   Hot!   ')).toBe('super-hot');
    });
  });

  describe('create', () => {
    it('should generate slug from name when slug is omitted', async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.create.mockResolvedValueOnce({
        id: 'tag-1',
        name: 'Summer Deals',
        slug: 'summer-deals',
        colorCode: '#0d6efd',
        isActive: true,
        _count: { products: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        name: 'Summer Deals',
        colorCode: '#0d6efd',
      });

      expect(result.slug).toBe('summer-deals');
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Summer Deals',
          slug: 'summer-deals',
          colorCode: '#0d6efd',
          isActive: true,
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should throw ConflictException if explicit slug already exists', async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.create({
          name: 'Summer',
          slug: 'summer',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tag results', async () => {
      mockPrisma.tag.findMany.mockResolvedValueOnce([
        {
          id: 'tag-1',
          name: 'Summer',
          slug: 'summer',
          colorCode: '#ff0000',
          isActive: true,
          _count: { products: 5 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.tag.count.mockResolvedValueOnce(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items.length).toBe(1);
      expect(result.items[0].productCount).toBe(5);
      expect(result.total).toBe(1);
    });
  });

  describe('resolveOrCreateTags', () => {
    it('should resolve existing tag IDs and create new tags on-the-fly', async () => {
      mockPrisma.tag.findMany.mockResolvedValueOnce([{ id: 'uuid-existing' }]);
      mockPrisma.tag.findFirst.mockResolvedValueOnce(null);
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.create.mockResolvedValueOnce({ id: 'uuid-new' });

      const resolved = await service.resolveOrCreateTags(
        ['uuid-existing'],
        ['Fresh Arrival'],
      );

      expect(resolved).toContain('uuid-existing');
      expect(resolved).toContain('uuid-new');
    });
  });

  describe('delete', () => {
    it('should delete existing tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: 'tag-1',
        name: 'Summer',
      });
      mockPrisma.tag.delete.mockResolvedValueOnce({ id: 'tag-1' });

      const res = await service.delete('tag-1');
      expect(res.id).toBe('tag-1');
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
      });
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
