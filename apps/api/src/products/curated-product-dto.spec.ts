import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CuratedProductsDto } from './dto/public-product.dto.js';
import { HeroBannerItemDto } from '../settings/dto/hero-banner.dto.js';

describe('Curated Products and Hero Banner DTO Validation', () => {
  it('validates a correct HeroBannerItemDto', async () => {
    const raw = {
      id: 'banner-1',
      title: 'Grand Opening Sale',
      subtitle: 'Up to 50% discount on official gear',
      imageUrl: '/banners/hero-1.webp',
      linkUrl: '/shop?hasDiscount=true',
      badgeText: 'HOT DEAL',
      sortOrder: 1,
      isActive: true,
    };

    const instance = plainToInstance(HeroBannerItemDto, raw);
    const errors = await validate(instance);
    expect(errors.length).toBe(0);
    expect(instance.id).toBe('banner-1');
    expect(instance.sortOrder).toBe(1);
    expect(instance.isActive).toBe(true);
  });

  it('rejects HeroBannerItemDto missing mandatory fields', async () => {
    const raw = {
      title: 'No ID or Image',
    };

    const instance = plainToInstance(HeroBannerItemDto, raw);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    const fieldNames = errors.map((e) => e.property);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('imageUrl');
  });

  it('instantiates CuratedProductsDto with product collections', () => {
    const curated = new CuratedProductsDto();
    curated.flashDeals = [];
    curated.featured = [];
    curated.newArrivals = [];
    curated.bestSellers = [];

    expect(curated.flashDeals).toEqual([]);
    expect(curated.featured).toEqual([]);
    expect(curated.newArrivals).toEqual([]);
    expect(curated.bestSellers).toEqual([]);
  });
});
