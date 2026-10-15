import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AttributeType } from '@prisma/client';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
  AttributeQueryDto,
} from './index.js';

describe('Attribute DTO Validation', () => {
  describe('CreateAttributeDto', () => {
    it('should validate valid attribute with inline values', async () => {
      const payload = {
        name: 'Color',
        slug: 'color',
        type: AttributeType.COLOR,
        description: 'Product color swatches',
        sortOrder: 1,
        isActive: true,
        values: [
          { value: 'Red', label: 'Crimson', colorCode: '#FF0000', sortOrder: 1 },
          { value: 'Blue', colorCode: '#00F', sortOrder: 2 },
        ],
      };

      const dto = plainToInstance(CreateAttributeDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept minimal valid attribute', async () => {
      const dto = plainToInstance(CreateAttributeDto, { name: 'Size' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing name', async () => {
      const dto = plainToInstance(CreateAttributeDto, { type: AttributeType.TEXT });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.property === 'name')).toBeDefined();
    });

    it('should reject over-length name (> 100 characters)', async () => {
      const dto = plainToInstance(CreateAttributeDto, { name: 'a'.repeat(101) });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.property === 'name')).toBeDefined();
    });

    it('should reject invalid slug format', async () => {
      const badSlugs = ['Invalid_Slug', 'has space', '-lead', 'trail-', 'bad--slug'];
      for (const slug of badSlugs) {
        const dto = plainToInstance(CreateAttributeDto, { name: 'Size', slug });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.find((e) => e.property === 'slug')).toBeDefined();
      }
    });

    it('should reject invalid AttributeType enum', async () => {
      const dto = plainToInstance(CreateAttributeDto, {
        name: 'Color',
        type: 'INVALID_TYPE' as unknown as AttributeType,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.property === 'type')).toBeDefined();
    });
  });

  describe('CreateAttributeValueDto', () => {
    it('should validate valid attribute value', async () => {
      const dto = plainToInstance(CreateAttributeValueDto, {
        value: 'XL',
        label: 'Extra Large',
        sortOrder: 1,
        isActive: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate valid hex color codes (#RGB and #RRGGBB)', async () => {
      const validHexCodes = ['#000', '#fff', '#FFF', '#123456', '#abcdef', '#ABCDEF'];
      for (const colorCode of validHexCodes) {
        const dto = plainToInstance(CreateAttributeValueDto, {
          value: 'Color',
          colorCode,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid hex color codes', async () => {
      const invalidHexCodes = ['red', '000000', '#1234', '#1234567', '#gggggg', '#12'];
      for (const colorCode of invalidHexCodes) {
        const dto = plainToInstance(CreateAttributeValueDto, {
          value: 'Color',
          colorCode,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.find((e) => e.property === 'colorCode')).toBeDefined();
      }
    });

    it('should reject missing value', async () => {
      const dto = plainToInstance(CreateAttributeValueDto, { label: 'Small' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.property === 'value')).toBeDefined();
    });
  });

  describe('AttributeQueryDto', () => {
    it('should transform string isActive correctly', async () => {
      const dtoTrue = plainToInstance(AttributeQueryDto, { isActive: 'true' });
      expect(dtoTrue.isActive).toBe(true);
      expect((await validate(dtoTrue)).length).toBe(0);

      const dtoFalse = plainToInstance(AttributeQueryDto, { isActive: 'false' });
      expect(dtoFalse.isActive).toBe(false);
      expect((await validate(dtoFalse)).length).toBe(0);
    });

    it('should accept valid type filter', async () => {
      const dto = plainToInstance(AttributeQueryDto, { type: AttributeType.COLOR });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid sortBy fields', async () => {
      const dto = plainToInstance(AttributeQueryDto, { sortBy: 'unsupported' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find((e) => e.property === 'sortBy')).toBeDefined();
    });

    it('should accept allowed sortBy fields', async () => {
      const allowed = ['name', 'sortOrder', 'createdAt'] as const;
      for (const sortBy of allowed) {
        const dto = plainToInstance(AttributeQueryDto, { sortBy });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });
});
