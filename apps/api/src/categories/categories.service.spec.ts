import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      category: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new CategoriesService(prismaMock);
  });

  describe('create', () => {
    it('should create a root category with auto-generated slug', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce(null); // slug check
      prismaMock.category.create.mockResolvedValueOnce({
        id: 'cat-1',
        name: "Men's Footwear",
        slug: 'mens-footwear',
        description: null,
        imageUrl: null,
        parentId: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        _count: { children: 0 },
      });

      const result = await service.create({ name: "Men's Footwear" });

      expect(result.id).toBe('cat-1');
      expect(result.slug).toBe('mens-footwear');
      expect(prismaMock.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Men's Footwear",
            slug: 'mens-footwear',
          }),
        }),
      );
    });

    it('should auto-resolve slug collisions with a numeric suffix', async () => {
      // First slug check hits existing, second hits null
      prismaMock.category.findUnique
        .mockResolvedValueOnce({ id: 'existing-id' }) // 'laptops' taken
        .mockResolvedValueOnce(null); // 'laptops-1' available

      prismaMock.category.create.mockResolvedValueOnce({
        id: 'cat-2',
        name: 'Laptops',
        slug: 'laptops-1',
        description: null,
        imageUrl: null,
        parentId: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        _count: { children: 0 },
      });

      const result = await service.create({ name: 'Laptops' });
      expect(result.slug).toBe('laptops-1');
    });

    it('should allow creating a subcategory under a Level 1 parent', async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce({ id: 'parent-1', parentId: null }) // parent check
        .mockResolvedValueOnce({ parentId: null }); // depth calculation: Level 1

      prismaMock.category.create.mockResolvedValueOnce({
        id: 'cat-3',
        name: 'Gaming Laptops',
        slug: 'gaming-laptops',
        parentId: 'parent-1',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: { id: 'parent-1', name: 'Laptops', slug: 'laptops' },
        _count: { children: 0 },
      });

      const result = await service.create({ name: 'Gaming Laptops', parentId: 'parent-1' });
      expect(result.parentId).toBe('parent-1');
    });

    it('should throw BadRequestException if parent is already at maximum Level 3 depth', async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce({ id: 'parent-level-3', parentId: 'p2' }) // parent exists
        .mockResolvedValueOnce({ parentId: 'p2' }) // getCategoryDepth: Level 1 check
        .mockResolvedValueOnce({ parentId: 'p1' }) // Level 2 check
        .mockResolvedValueOnce({ parentId: null }); // Level 3 reached

      await expect(
        service.create({ name: 'Beyond Level 3', parentId: 'parent-level-3' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should preserve existing slug when name changes without slug payload', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Old Name',
        slug: 'old-name',
        parentId: null,
      });

      prismaMock.category.update.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'New Name',
        slug: 'old-name',
        description: null,
        imageUrl: null,
        parentId: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        parent: null,
        _count: { children: 0 },
      });

      const result = await service.update('cat-1', { name: 'New Name' });
      expect(result.slug).toBe('old-name');
    });

    it('should throw BadRequestException if category is set to be its own parent', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: 'cat-1',
        slug: 'cat-1',
        parentId: null,
      });

      await expect(service.update('cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cycle is detected (setting child as parent)', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: 'root-1',
        slug: 'root-1',
        parentId: null,
      });

      // getDescendantIds check: root-1 has child child-1
      prismaMock.category.findMany
        .mockResolvedValueOnce([{ id: 'child-1' }]) // direct children
        .mockResolvedValueOnce([]); // no further grandchildren

      await expect(service.update('root-1', { parentId: 'child-1' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should throw ConflictException if category has subcategories', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Electronics',
        _count: { children: 3 },
      });

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      expect(prismaMock.category.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete an empty category', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: 'empty-cat',
        name: 'Empty Category',
        _count: { children: 0 },
      });
      prismaMock.category.delete.mockResolvedValueOnce({ id: 'empty-cat' });

      const result = await service.remove('empty-cat');
      expect(result.success).toBe(true);
      expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: 'empty-cat' } });
    });
  });

  describe('findPublicTree', () => {
    it('should assemble a nested hierarchical tree for active categories', async () => {
      prismaMock.category.findMany.mockResolvedValueOnce([
        { id: '1', name: 'Electronics', slug: 'electronics', imageUrl: null, parentId: null, sortOrder: 0 },
        { id: '2', name: 'Laptops', slug: 'laptops', imageUrl: null, parentId: '1', sortOrder: 0 },
        { id: '3', name: 'Gaming Laptops', slug: 'gaming-laptops', imageUrl: null, parentId: '2', sortOrder: 0 },
      ]);

      const tree = await service.findPublicTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('2');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].id).toBe('3');
    });
  });

  describe('findBySlug', () => {
    it('should return category with breadcrumb hierarchy trail', async () => {
      prismaMock.category.findUnique
        .mockResolvedValueOnce({
          id: '3',
          name: 'Gaming Laptops',
          slug: 'gaming-laptops',
          description: 'High performance laptops',
          imageUrl: null,
          parentId: '2',
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          parent: { id: '2', name: 'Laptops', slug: 'laptops', parentId: '1' },
          children: [],
        })
        .mockResolvedValueOnce({
          id: '2',
          name: 'Laptops',
          slug: 'laptops',
          parentId: '1',
        })
        .mockResolvedValueOnce({
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
        });

      const result = await service.findBySlug('gaming-laptops');
      expect(result.id).toBe('3');
      expect(result.breadcrumbs).toHaveLength(3);
      expect(result.breadcrumbs[0].slug).toBe('electronics');
      expect(result.breadcrumbs[1].slug).toBe('laptops');
      expect(result.breadcrumbs[2].slug).toBe('gaming-laptops');
    });

    it('should throw NotFoundException if category is inactive or non-existent', async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce(null);
      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
