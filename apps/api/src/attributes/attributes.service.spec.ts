import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AttributeType } from '@prisma/client';
import { AttributesService } from './attributes.service.js';

describe('AttributesService', () => {
  let service: AttributesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      attribute: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      attributeValue: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => callback(prismaMock)),
    };
    service = new AttributesService(prismaMock);
  });

  describe('create', () => {
    it('should create an attribute with auto-generated slug', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce(null);
      const createdRecord = {
        id: 'attr-1',
        name: 'Shoe Size',
        slug: 'shoe-size',
        type: AttributeType.TEXT,
        description: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      };
      prismaMock.attribute.create.mockResolvedValueOnce(createdRecord);
      prismaMock.attribute.findUniqueOrThrow.mockResolvedValueOnce(createdRecord);

      const result = await service.create({ name: 'Shoe Size' });

      expect(result.id).toBe('attr-1');
      expect(result.slug).toBe('shoe-size');
      expect(result.counts).toEqual({ products: 0, variants: 0 });
    });

    it('should auto-resolve slug collision with numeric suffix', async () => {
      prismaMock.attribute.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const createdRecord = {
        id: 'attr-2',
        name: 'Color',
        slug: 'color-1',
        type: AttributeType.COLOR,
        description: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      };
      prismaMock.attribute.create.mockResolvedValueOnce(createdRecord);
      prismaMock.attribute.findUniqueOrThrow.mockResolvedValueOnce(createdRecord);

      const result = await service.create({ name: 'Color', type: AttributeType.COLOR });

      expect(result.slug).toBe('color-1');
    });

    it('should reject duplicate values in initial values array', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({
          name: 'Size',
          values: [{ value: 'M' }, { value: 'm' }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject explicit slug that is already taken', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({ id: 'other-id' });

      await expect(
        service.create({ name: 'Color', slug: 'color' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllAdmin', () => {
    it('should return paginated attributes with counts and values', async () => {
      prismaMock.attribute.findMany.mockResolvedValueOnce([
        {
          id: 'attr-1',
          name: 'Color',
          slug: 'color',
          type: AttributeType.COLOR,
          description: null,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          values: [
            {
              id: 'val-1',
              attributeId: 'attr-1',
              value: 'Red',
              label: 'Red',
              colorCode: '#FF0000',
              sortOrder: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ]);
      prismaMock.attribute.count.mockResolvedValueOnce(1);

      const result = await service.findAllAdmin({ page: 1, limit: 10 });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].values.length).toBe(1);
      expect(result.items[0].values[0].colorCode).toBe('#FF0000');
    });
  });

  describe('findOneAdmin', () => {
    it('should return single attribute when found', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
        slug: 'color',
        type: AttributeType.COLOR,
        description: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      });

      const result = await service.findOneAdmin('attr-1');
      expect(result.id).toBe('attr-1');
      expect(result.name).toBe('Color');
    });

    it('should throw NotFoundException when missing', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOneAdmin('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should preserve slug on rename when slug is omitted', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
        slug: 'color',
        type: AttributeType.COLOR,
        description: null,
        isActive: true,
        sortOrder: 0,
        values: [],
      });

      prismaMock.attribute.update.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Primary Color',
        slug: 'color',
        type: AttributeType.COLOR,
        description: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        values: [],
      });

      const result = await service.update('attr-1', { name: 'Primary Color' });

      expect(result.name).toBe('Primary Color');
      expect(result.slug).toBe('color');
      expect(prismaMock.attribute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'color' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should remove unreferenced attribute', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
      });
      prismaMock.attribute.delete.mockResolvedValueOnce({});

      const result = await service.remove('attr-1');

      expect(result.success).toBe(true);
      expect(prismaMock.attribute.delete).toHaveBeenCalledWith({
        where: { id: 'attr-1' },
      });
    });

    it('should throw NotFoundException if attribute to delete does not exist', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('values management', () => {
    it('should create an attribute value successfully', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
      });
      prismaMock.attributeValue.findUnique.mockResolvedValueOnce(null);
      prismaMock.attributeValue.create.mockResolvedValueOnce({
        id: 'val-1',
        attributeId: 'attr-1',
        value: 'Navy',
        label: 'Navy Blue',
        colorCode: '#000080',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createValue('attr-1', {
        value: 'Navy',
        label: 'Navy Blue',
        colorCode: '#000080',
      });

      expect(result.id).toBe('val-1');
      expect(result.colorCode).toBe('#000080');
    });

    it('should reject duplicate value for the same attribute', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
      });
      prismaMock.attributeValue.findUnique.mockResolvedValueOnce({
        id: 'existing-val',
      });

      await expect(
        service.createValue('attr-1', { value: 'Navy' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should remove an attribute value successfully', async () => {
      prismaMock.attributeValue.findUnique.mockResolvedValueOnce({
        id: 'val-1',
        attributeId: 'attr-1',
        value: 'Navy',
      });
      prismaMock.attributeValue.delete.mockResolvedValueOnce({});

      const result = await service.removeValue('attr-1', 'val-1');
      expect(result.success).toBe(true);
      expect(prismaMock.attributeValue.delete).toHaveBeenCalledWith({
        where: { id: 'val-1' },
      });
    });
  });

  describe('public endpoints', () => {
    it('should return active attributes and active values for public listing', async () => {
      prismaMock.attribute.findMany.mockResolvedValueOnce([
        {
          id: 'attr-1',
          name: 'Color',
          slug: 'color',
          type: AttributeType.COLOR,
          description: null,
          sortOrder: 1,
          values: [
            {
              id: 'val-1',
              value: 'Blue',
              label: 'Blue',
              colorCode: '#00F',
              sortOrder: 1,
            },
          ],
        },
      ]);

      const result = await service.findAllPublic();
      expect(result.length).toBe(1);
      expect(result[0].values.length).toBe(1);
    });

    it('should find active attribute by slug', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        name: 'Color',
        slug: 'color',
        type: AttributeType.COLOR,
        description: null,
        isActive: true,
        sortOrder: 1,
        values: [],
      });

      const result = await service.findBySlugPublic('color');
      expect(result.slug).toBe('color');
    });

    it('should throw NotFoundException for missing or inactive slug', async () => {
      prismaMock.attribute.findUnique.mockResolvedValueOnce({
        id: 'attr-1',
        isActive: false,
      });

      await expect(service.findBySlugPublic('inactive-attr')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
