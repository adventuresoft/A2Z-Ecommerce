import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service.js';

describe('BrandsService', () => {
  let service: BrandsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      brand: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new BrandsService(prismaMock);
  });

  describe('create', () => {
    it('should create a brand with minimal valid data and auto-generated slug', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null); // slug availability check
      const createdRecord = {
        id: 'brand-1',
        name: "Levi's Originals",
        slug: 'levis-originals',
        description: null,
        logoUrl: null,
        website: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.brand.create.mockResolvedValueOnce(createdRecord);

      const result = await service.create({ name: "Levi's Originals" });

      expect(result.id).toBe('brand-1');
      expect(result.slug).toBe('levis-originals');
      expect(result.isActive).toBe(true);
      expect(result.sortOrder).toBe(0);
      expect(result.counts).toEqual({ products: 0 });
      expect(prismaMock.brand.create).toHaveBeenCalledWith({
        data: {
          name: "Levi's Originals",
          slug: 'levis-originals',
          description: null,
          logoUrl: null,
          website: null,
          isActive: true,
          sortOrder: 0,
        },
      });
    });

    it('should auto-resolve slug collision with numeric suffix', async () => {
      // 'apple' taken, 'apple-1' free
      prismaMock.brand.findUnique
        .mockResolvedValueOnce({ id: 'existing-id' })
        .mockResolvedValueOnce(null);

      prismaMock.brand.create.mockResolvedValueOnce({
        id: 'brand-2',
        name: 'Apple',
        slug: 'apple-1',
        description: null,
        logoUrl: null,
        website: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({ name: 'Apple' });
      expect(result.slug).toBe('apple-1');
    });

    it('should reject a duplicate explicitly supplied slug with ConflictException', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce({ id: 'other-brand-id' });

      await expect(
        service.create({ name: 'Samsung', slug: 'samsung' }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.brand.create).not.toHaveBeenCalled();
    });

    it('should catch Prisma P2002 unique constraint violation and throw ConflictException', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null);
      const p2002Error = new Error('Unique constraint failed');
      (p2002Error as any).code = 'P2002';
      prismaMock.brand.create.mockRejectedValueOnce(p2002Error);

      await expect(service.create({ name: 'Sony' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllAdmin', () => {
    it('should list brands with pagination, search, isActive filter, and sorting', async () => {
      const mockBrands = [
        {
          id: 'b-1',
          name: 'Samsung',
          slug: 'samsung',
          description: 'Tech',
          logoUrl: null,
          website: 'https://samsung.com',
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaMock.brand.findMany.mockResolvedValueOnce(mockBrands);
      prismaMock.brand.count.mockResolvedValueOnce(1);

      const result = await service.findAllAdmin({
        page: 1,
        limit: 10,
        search: 'sam',
        isActive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].counts).toEqual({ products: 0 });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prismaMock.brand.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'sam', mode: 'insensitive' } },
            { slug: { contains: 'sam', mode: 'insensitive' } },
          ],
          isActive: true,
        },
        skip: 0,
        take: 10,
        orderBy: [{ name: 'asc' }],
      });
    });

    it('should include secondary name asc ordering when sorting by sortOrder', async () => {
      prismaMock.brand.findMany.mockResolvedValueOnce([]);
      prismaMock.brand.count.mockResolvedValueOnce(0);

      await service.findAllAdmin({
        sortBy: 'sortOrder',
        sortOrder: 'desc',
      });

      expect(prismaMock.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ sortOrder: 'desc' }, { name: 'asc' }],
        }),
      );
    });
  });

  describe('findOneAdmin', () => {
    it('should return brand by ID', async () => {
      const brand = {
        id: 'b-1',
        name: 'Nike',
        slug: 'nike',
        description: null,
        logoUrl: null,
        website: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.brand.findUnique.mockResolvedValueOnce(brand);

      const result = await service.findOneAdmin('b-1');
      expect(result.id).toBe('b-1');
      expect(result.counts).toEqual({ products: 0 });
    });

    it('should throw NotFoundException if brand does not exist', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOneAdmin('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should preserve slug on rename when no slug is supplied', async () => {
      const existing = { id: 'b-1', slug: 'samsung' };
      prismaMock.brand.findUnique.mockResolvedValueOnce(existing);
      prismaMock.brand.update.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Samsung Electronics',
        slug: 'samsung',
        description: null,
        logoUrl: null,
        website: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('b-1', {
        name: 'Samsung Electronics',
      });

      expect(result.slug).toBe('samsung');
      expect(prismaMock.brand.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: expect.objectContaining({
          name: 'Samsung Electronics',
          slug: 'samsung',
        }),
      });
    });

    it('should update slug when new explicit unique slug is supplied', async () => {
      const existing = { id: 'b-1', slug: 'samsung' };
      prismaMock.brand.findUnique
        .mockResolvedValueOnce(existing) // existing lookup
        .mockResolvedValueOnce(null); // new slug conflict lookup

      prismaMock.brand.update.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Samsung',
        slug: 'samsung-global',
        description: null,
        logoUrl: null,
        website: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('b-1', { slug: 'samsung-global' });
      expect(result.slug).toBe('samsung-global');
    });

    it('should throw ConflictException if new explicit slug is used by another brand', async () => {
      const existing = { id: 'b-1', slug: 'samsung' };
      prismaMock.brand.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'b-2' }); // conflict

      await expect(
        service.update('b-1', { slug: 'apple' }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.brand.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if brand to update does not exist', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null);

      await expect(service.update('missing', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should catch Prisma P2002 on update and throw ConflictException', async () => {
      const existing = { id: 'b-1', slug: 'samsung' };
      prismaMock.brand.findUnique.mockResolvedValueOnce(existing);
      const p2002 = new Error('Unique constraint violation');
      (p2002 as any).code = 'P2002';
      prismaMock.brand.update.mockRejectedValueOnce(p2002);

      await expect(service.update('b-1', { name: 'Rename' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an unreferenced brand successfully when product count is 0', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Nike',
      });
      prismaMock.brand.delete.mockResolvedValueOnce({ id: 'b-1' });

      const result = await service.remove('b-1');
      expect(result).toEqual({
        success: true,
        message: "Brand 'Nike' deleted successfully.",
      });
      expect(prismaMock.brand.delete).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      });
    });

    it('should reject deletion with ConflictException (409) when brand has associated products', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Apple',
      });

      // Mock the countBrandProducts seam returning > 0
      vi.spyOn(service as any, 'countBrandProducts').mockResolvedValueOnce(3);

      await expect(service.remove('b-1')).rejects.toThrow(ConflictException);
      expect(prismaMock.brand.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if brand to delete does not exist', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('public endpoints', () => {
    it('findAllPublic should return active brands ordered by sortOrder then name', async () => {
      const publicBrands = [
        {
          id: 'b-1',
          name: 'Apple',
          slug: 'apple',
          description: 'Tech',
          logoUrl: null,
          website: 'https://apple.com',
          sortOrder: 1,
        },
        {
          id: 'b-2',
          name: 'Samsung',
          slug: 'samsung',
          description: null,
          logoUrl: null,
          website: null,
          sortOrder: 2,
        },
      ];
      prismaMock.brand.findMany.mockResolvedValueOnce(publicBrands);

      const result = await service.findAllPublic();
      expect(result).toEqual(publicBrands);
      expect(prismaMock.brand.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          website: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    });

    it('findBySlug should return active brand details', async () => {
      const activeBrand = {
        id: 'b-1',
        name: 'Samsung',
        slug: 'samsung',
        description: 'Tech',
        logoUrl: '/uploads/brands/samsung.png',
        website: 'https://samsung.com',
        sortOrder: 2,
        isActive: true,
      };
      prismaMock.brand.findUnique.mockResolvedValueOnce(activeBrand);

      const result = await service.findBySlug('samsung');
      expect(result).toEqual({
        id: 'b-1',
        name: 'Samsung',
        slug: 'samsung',
        description: 'Tech',
        logoUrl: '/uploads/brands/samsung.png',
        website: 'https://samsung.com',
        sortOrder: 2,
      });
    });

    it('findBySlug should throw NotFoundException when slug does not exist', async () => {
      prismaMock.brand.findUnique.mockResolvedValueOnce(null);

      await expect(service.findBySlug('unknown-brand')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findBySlug should throw NotFoundException when brand is inactive', async () => {
      const inactiveBrand = {
        id: 'b-99',
        name: 'Retro Audio Co',
        slug: 'retro-audio-co',
        description: null,
        logoUrl: null,
        website: null,
        sortOrder: 99,
        isActive: false,
      };
      prismaMock.brand.findUnique.mockResolvedValueOnce(inactiveBrand);

      await expect(service.findBySlug('retro-audio-co')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
