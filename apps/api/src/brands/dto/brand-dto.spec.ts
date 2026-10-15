import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBrandDto, BrandQueryDto } from './index.js';

describe('Brand DTO Validation', () => {
  describe('CreateBrandDto', () => {
    it('should validate valid brand payload', async () => {
      const payload = {
        name: 'Samsung',
        slug: 'samsung',
        description: 'Tech company',
        logoUrl: '/uploads/brands/brand_123.png',
        website: 'https://www.samsung.com',
        isActive: true,
        sortOrder: 1,
      };

      const dto = plainToInstance(CreateBrandDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept minimal valid brand data', async () => {
      const payload = { name: 'Samsung' };
      const dto = plainToInstance(CreateBrandDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid website URL', async () => {
      const invalidWebsites = ['not a url', 'ftp://example.com', 'javascript:alert(1)'];

      for (const website of invalidWebsites) {
        const dto = plainToInstance(CreateBrandDto, {
          name: 'Samsung',
          website,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const websiteError = errors.find((e) => e.property === 'website');
        expect(websiteError).toBeDefined();
      }
    });

    it('should accept valid http and https websites', async () => {
      const validWebsites = ['http://example.com', 'https://www.samsung.com/global'];

      for (const website of validWebsites) {
        const dto = plainToInstance(CreateBrandDto, {
          name: 'Samsung',
          website,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject over-length name (> 100 characters)', async () => {
      const dto = plainToInstance(CreateBrandDto, {
        name: 'a'.repeat(101),
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should reject bad slug formats', async () => {
      const badSlugs = [
        'Invalid_Slug',
        'slug with spaces',
        'bad--slug',
        '-leading-hyphen',
        'trailing-hyphen-',
        'UPPERCASE',
        'slug!@#',
      ];

      for (const slug of badSlugs) {
        const dto = plainToInstance(CreateBrandDto, {
          name: 'Samsung',
          slug,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const slugError = errors.find((e) => e.property === 'slug');
        expect(slugError).toBeDefined();
      }
    });

    it('should accept valid slug formats', async () => {
      const validSlugs = ['samsung', 'apple-1', 'levis-originals-2026', 'brand-3'];

      for (const slug of validSlugs) {
        const dto = plainToInstance(CreateBrandDto, {
          name: 'Brand',
          slug,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('BrandQueryDto', () => {
    it('should correctly parse isActive="false" string to boolean false', async () => {
      const dto = plainToInstance(BrandQueryDto, {
        isActive: 'false',
      });
      expect(dto.isActive).toBe(false);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should correctly parse isActive="true" string to boolean true', async () => {
      const dto = plainToInstance(BrandQueryDto, {
        isActive: 'true',
      });
      expect(dto.isActive).toBe(true);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid isActive values', async () => {
      const dto = plainToInstance(BrandQueryDto, {
        isActive: 'not-a-boolean',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const activeError = errors.find((e) => e.property === 'isActive');
      expect(activeError).toBeDefined();
    });

    it('should reject unsupported sortBy fields', async () => {
      const rejectedSortBy = ['website', 'description', 'id', 'logoUrl', 'password'];

      for (const sortBy of rejectedSortBy) {
        const dto = plainToInstance(BrandQueryDto, {
          sortBy,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const sortError = errors.find((e) => e.property === 'sortBy');
        expect(sortError).toBeDefined();
      }
    });

    it('should accept valid sortBy fields', async () => {
      const allowedSortBy = ['name', 'sortOrder', 'createdAt'] as const;

      for (const sortBy of allowedSortBy) {
        const dto = plainToInstance(BrandQueryDto, {
          sortBy,
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });
});
