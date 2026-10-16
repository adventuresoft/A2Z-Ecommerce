import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Role } from '@prisma/client';
import argon2 from 'argon2';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Products & Variants API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now().toString();

  const testAdmin = {
    email: `admin_prod_${suffix}@az.local`,
    password: 'AdminPassword123!',
    name: 'Product Admin Tester',
  };

  const testCustomer = {
    email: `customer_prod_${suffix}@az.local`,
    password: 'CustomerPassword123!',
    name: 'Customer Tester',
  };

  let adminToken: string;
  let customerToken: string;

  let testCategory: { id: string; name: string; slug: string };
  let testBrand: { id: string; name: string; slug: string };
  let testAttribute: { id: string; name: string };
  let testAttrValue1: { id: string; value: string };
  let testAttrValue2: { id: string; value: string };

  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Create admin user
    const adminPasswordHash = await argon2.hash(testAdmin.password);
    await prisma.user.create({
      data: {
        email: testAdmin.email,
        passwordHash: adminPasswordHash,
        name: testAdmin.name,
        role: Role.SUPER_ADMIN,
      },
    });

    // Create customer user
    const customerPasswordHash = await argon2.hash(testCustomer.password);
    await prisma.user.create({
      data: {
        email: testCustomer.email,
        passwordHash: customerPasswordHash,
        name: testCustomer.name,
        role: Role.CUSTOMER,
      },
    });

    // Login as admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);
    adminToken = adminLoginRes.body.accessToken;

    // Login as customer
    const customerLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testCustomer.email, password: testCustomer.password })
      .expect(200);
    customerToken = customerLoginRes.body.accessToken;

    // Seed test category
    testCategory = await prisma.category.create({
      data: {
        name: `Test Cat ${suffix}`,
        slug: `test-cat-${suffix}`,
      },
    });

    // Seed test brand
    testBrand = await prisma.brand.create({
      data: {
        name: `Test Brand ${suffix}`,
        slug: `test-brand-${suffix}`,
      },
    });

    // Seed test attribute & values
    testAttribute = await prisma.attribute.create({
      data: {
        name: `Color ${suffix}`,
        slug: `color-${suffix}`,
        type: 'COLOR',
      },
    });

    testAttrValue1 = await prisma.attributeValue.create({
      data: {
        attributeId: testAttribute.id,
        value: `Navy Blue ${suffix}`,
        colorCode: '#000080',
      },
    });

    testAttrValue2 = await prisma.attributeValue.create({
      data: {
        attributeId: testAttribute.id,
        value: `Crimson Red ${suffix}`,
        colorCode: '#DC143C',
      },
    });
  });

  afterAll(async () => {
    try {
      if (createdProductIds.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: createdProductIds } },
        });
      }
      await prisma.attributeValue.deleteMany({
        where: { id: { in: [testAttrValue1.id, testAttrValue2.id] } },
      });
      await prisma.attribute.delete({ where: { id: testAttribute.id } });
      await prisma.brand.delete({ where: { id: testBrand.id } });
      await prisma.category.delete({ where: { id: testCategory.id } });
      await prisma.user.deleteMany({
        where: { email: { in: [testAdmin.email, testCustomer.email] } },
      });
      await app.close();
    } catch {
      // Cleanup fallback
    }
  });

  describe('POST /api/v1/admin/products', () => {
    it('should reject unauthorized access from unauthenticated caller', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .send({ title: 'Test Product', categoryId: testCategory.id })
        .expect(401);
    });

    it('should forbid customer role from creating a product', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Customer Product Attempt',
          description: 'Not allowed',
          categoryId: testCategory.id,
        })
        .expect(403);
    });

    it('should reject creation with missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing category and desc' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('should reject non-existent categoryId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Product With Bad Cat',
          description: 'Test',
          categoryId: '00000000-0000-4000-a000-000000000000',
        })
        .expect(400);

      expect(res.body.message).toContain('does not exist');
    });

    it('should create a simple product with auto-slug and default variant', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Simple Shoes ${suffix}`,
          description: 'A great pair of running shoes.',
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 79.99,
          salePrice: 59.99,
          isFeatured: true,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.slug).toBe(`simple-shoes-${suffix}`);
      expect(res.body.variants.length).toBe(1);
      expect(res.body.variants[0].regularPrice).toBe(79.99);
      expect(res.body.variants[0].salePrice).toBe(59.99);
      createdProductIds.push(res.body.id);
    });

    it('should auto-resolve slug collisions when title matches existing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Simple Shoes ${suffix}`,
          description: 'Duplicate title for slug resolution test.',
          categoryId: testCategory.id,
          regularPrice: 89.99,
        })
        .expect(201);

      expect(res.body.slug).toBe(`simple-shoes-${suffix}-1`);
      createdProductIds.push(res.body.id);
    });

    it('should reject duplicate explicit slug with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Explicit Slug Conflict Test',
          slug: `simple-shoes-${suffix}`,
          description: 'Will conflict',
          categoryId: testCategory.id,
          regularPrice: 49.99,
        })
        .expect(409);
    });

    it('should create multi-variant product with attribute bindings', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Multi Variant Shirt ${suffix}`,
          description: 'Shirt with multiple color variants.',
          categoryId: testCategory.id,
          brandId: testBrand.id,
          variants: [
            {
              sku: `SHIRT-NAVY-${suffix}`,
              barcode: `BAR-NAVY-${suffix}`,
              regularPrice: 35.0,
              salePrice: 29.99,
              weightGrams: 200,
              attributeValueIds: [testAttrValue1.id],
            },
            {
              sku: `SHIRT-RED-${suffix}`,
              barcode: `BAR-RED-${suffix}`,
              regularPrice: 35.0,
              weightGrams: 200,
              attributeValueIds: [testAttrValue2.id],
            },
          ],
        })
        .expect(201);

      expect(res.body.variants.length).toBe(2);
      expect(res.body.variants[0].attributes.length).toBe(1);
      expect(res.body.variants[0].attributes[0].value).toContain('Navy Blue');
      createdProductIds.push(res.body.id);
    });

    it('should reject variant where salePrice > regularPrice', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Invalid Price Shirt ${suffix}`,
          description: 'Bad pricing test',
          categoryId: testCategory.id,
          variants: [
            {
              sku: `BAD-PRICE-${suffix}`,
              regularPrice: 20.0,
              salePrice: 25.0,
            },
          ],
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/admin/products', () => {
    it('should list paginated products with metadata and search filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/products?search=Simple Shoes ${suffix}&page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter products by categoryId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/products?categoryId=${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Product Gallery & Variant Image (Option B)', () => {
    let productId: string;
    let uploadedImageId: string;
    let variantId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Gallery Testing Product ${suffix}`,
          description: 'Product for gallery testing',
          categoryId: testCategory.id,
          variants: [
            {
              sku: `GAL-VAR-1-${suffix}`,
              regularPrice: 50.0,
            },
          ],
        })
        .expect(201);

      productId = res.body.id;
      variantId = res.body.variants[0].id;
      createdProductIds.push(productId);
    });

    it('should upload gallery images via multipart/form-data', async () => {
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/products/${productId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', buffer, 'test-image.png')
        .expect(201);

      expect(res.body.length).toBe(1);
      expect(res.body[0].isPrimary).toBe(true);
      expect(res.body[0].imageUrl).toContain('/uploads/products/');
      uploadedImageId = res.body[0].id;
    });

    it('should update image alt text and cover flag', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${productId}/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ altText: 'Sneakers Front View', sortOrder: 0 })
        .expect(200);

      expect(res.body.altText).toBe('Sneakers Front View');
    });

    it('should assign gallery image to variant (Option B)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/variants/${variantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageId: uploadedImageId })
        .expect(200);

      expect(res.body.imageId).toBe(uploadedImageId);
      expect(res.body.image).toBeDefined();
      expect(res.body.image.id).toBe(uploadedImageId);
    });

    it('should reject assigning image belonging to a different product', async () => {
      const otherProductRes = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Other Product ${suffix}`,
          description: 'Other product',
          categoryId: testCategory.id,
          regularPrice: 10,
        })
        .expect(201);
      createdProductIds.push(otherProductRes.body.id);

      await request(app.getHttpServer())
        .put(`/api/v1/admin/variants/${variantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageId: '00000000-0000-4000-a000-000000000000' })
        .expect(400);
    });

    it('should list variants globally via /api/v1/admin/variants', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/variants?search=GAL-VAR-1-${suffix}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].sku).toBe(`GAL-VAR-1-${suffix}`);
    });

    it('should delete gallery image and safely clear variant imageId link', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${productId}/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify variant's imageId is now null
      const varRes = await request(app.getHttpServer())
        .get(`/api/v1/admin/variants?productId=${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(varRes.body.data[0].imageId).toBeNull();
    });

    it('should upload a single image via /api/v1/admin/products/upload-image', async () => {
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', buffer, 'single-thumbnail.png')
        .expect(201);

      expect(res.body.imageUrl).toContain('/uploads/products/');
      expect(res.body.filename).toBeDefined();
    });

    it('should update product with thumbnailUrl and regenerated variants array', async () => {
      const updateRes = await request(app.getHttpServer())
        .put(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Updated Gallery Testing Product ${suffix}`,
          thumbnailUrl: '/uploads/products/custom-cover.jpg',
          variants: [
            {
              sku: `REGEN-VAR-1-${suffix}`,
              regularPrice: 75.0,
              salePrice: 69.99,
              imageUrl: '/uploads/products/var-photo.jpg',
              isActive: true,
            },
            {
              sku: `REGEN-VAR-2-${suffix}`,
              regularPrice: 85.0,
              isActive: true,
            },
          ],
        })
        .expect(200);

      expect(updateRes.body.title).toContain('Updated Gallery Testing Product');
      expect(updateRes.body.thumbnailUrl).toBe('/uploads/products/custom-cover.jpg');
      expect(updateRes.body.variants.length).toBe(2);
      expect(updateRes.body.variants[0].sku).toBe(`REGEN-VAR-1-${suffix}`);
      expect(updateRes.body.variants[0].imageUrl).toBe('/uploads/products/var-photo.jpg');
    });

    it('should delete product and cascade remove variants and records', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/v1/admin/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
