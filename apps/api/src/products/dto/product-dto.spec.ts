import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateProductDto } from './create-product.dto.js';
import { CreateProductVariantDto } from './variant.dto.js';
import { UpdateProductImageDto } from './product-image.dto.js';
import { PublicProductQueryDto } from './public-product.dto.js';

describe('Product DTO Validation', () => {
  it('should validate a complete valid CreateProductDto', async () => {
    const dto = new CreateProductDto();
    dto.title = 'Premium T-Shirt';
    dto.slug = 'premium-t-shirt';
    dto.description = 'A wonderful soft t-shirt.';
    dto.categoryId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    dto.isFeatured = true;
    dto.isActive = true;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when title and description are missing', async () => {
    const dto = new CreateProductDto();
    dto.categoryId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('title');
    expect(properties).toContain('description');
  });

  it('should fail validation when categoryId is not a valid UUID', async () => {
    const dto = new CreateProductDto();
    dto.title = 'Premium T-Shirt';
    dto.description = 'Description here';
    dto.categoryId = 'not-a-uuid';

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('categoryId');
  });

  it('should fail validation when variant regularPrice is <= 0', async () => {
    const variantDto = new CreateProductVariantDto();
    variantDto.sku = 'TSH-001';
    variantDto.regularPrice = 0;

    const errors = await validate(variantDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('regularPrice');
  });

  it('should pass validation for valid variant with attributes and image', async () => {
    const variantDto = new CreateProductVariantDto();
    variantDto.sku = 'TSH-RED-L';
    variantDto.regularPrice = 29.99;
    variantDto.salePrice = 24.99;
    variantDto.weightGrams = 200;
    variantDto.imageId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    variantDto.attributeValueIds = ['c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'];

    const errors = await validate(variantDto);
    expect(errors.length).toBe(0);
  });

  it('should validate UpdateProductImageDto', async () => {
    const imageDto = new UpdateProductImageDto();
    imageDto.altText = 'Front View';
    imageDto.isPrimary = true;
    imageDto.sortOrder = 0;

    const errors = await validate(imageDto);
    expect(errors.length).toBe(0);
  });

  it('should validate valid PublicProductQueryDto', async () => {
    const queryDto = new PublicProductQueryDto();
    queryDto.page = 2;
    queryDto.limit = 24;
    queryDto.q = 'macbook';
    queryDto.categorySlug = 'laptops';
    queryDto.minPrice = 50000;
    queryDto.maxPrice = 300000;
    queryDto.inStock = true;
    queryDto.hasDiscount = true;
    queryDto.sortBy = 'price_asc';

    const errors = await validate(queryDto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid sortBy or negative minPrice in PublicProductQueryDto', async () => {
    const queryDto = new PublicProductQueryDto();
    // @ts-expect-error testing invalid enum
    queryDto.sortBy = 'invalid_sort';
    queryDto.minPrice = -100;

    const errors = await validate(queryDto);
    expect(errors.length).toBe(2);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('sortBy');
    expect(properties).toContain('minPrice');
  });

  it('should accept valid tagIds and tags in CreateProductDto', async () => {
    const dto = new CreateProductDto();
    dto.title = 'Summer T-Shirt';
    dto.description = 'Comfortable cotton shirt';
    dto.categoryId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    dto.tagIds = ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'];
    dto.tags = ['Summer 2026', 'Trending'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid UUIDs in tagIds array', async () => {
    const dto = new CreateProductDto();
    dto.title = 'Summer T-Shirt';
    dto.description = 'Comfortable cotton shirt';
    dto.categoryId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    dto.tagIds = ['not-a-valid-uuid'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('tagIds');
  });

  it('should accept tagSlug and tags in PublicProductQueryDto', async () => {
    const queryDto = new PublicProductQueryDto();
    queryDto.tags = 'summer-collection,trending';
    queryDto.tagSlug = 'summer-collection';

    const errors = await validate(queryDto);
    expect(errors.length).toBe(0);
  });
});

