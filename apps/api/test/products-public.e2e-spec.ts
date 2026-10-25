import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Public Products API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now().toString();

  let testCategory: { id: string; name: string; slug: string };
  let testProduct: { id: string; title: string; slug: string };

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

    // Create a test category and product with variant & inventory
    testCategory = await prisma.category.create({
      data: {
        name: `Test Cat ${suffix}`,
        slug: `test-cat-${suffix}`,
        isActive: true,
      },
    });

    testProduct = await prisma.product.create({
      data: {
        title: `Public Test Phone ${suffix}`,
        slug: `public-test-phone-${suffix}`,
        description: 'Test phone description',
        shortDescription: 'Short test phone description',
        categoryId: testCategory.id,
        isActive: true,
        isFeatured: true,
        variants: {
          create: [
            {
              sku: `PUB-PH-${suffix}`,
              regularPrice: 25000,
              salePrice: 22000,
              isActive: true,
              inventory: {
                create: {
                  quantity: 15,
                  reservedQuantity: 2,
                },
              },
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    try {
      if (testProduct?.id) {
        await prisma.productVariant.deleteMany({
          where: { productId: testProduct.id },
        });
        await prisma.product.delete({
          where: { id: testProduct.id },
        });
      }
      if (testCategory?.id) {
        await prisma.category.delete({
          where: { id: testCategory.id },
        });
      }
      await app.close();
    } catch {
      // Ignore cleanup error
    }
  });

  it('GET /api/v1/products - should return public catalog listing with pagination and pricing', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products?categorySlug=${testCategory.slug}`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    const found = res.body.items.find((p: any) => p.id === testProduct.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(testProduct.title);
    expect(found.slug).toBe(testProduct.slug);
    expect(found.minPrice).toBe(22000);
    expect(found.maxPrice).toBe(22000);
    expect(found.regularPrice).toBe(25000);
    expect(found.salePrice).toBe(22000);
    expect(found.discountPercent).toBe(12);
    expect(found.inStock).toBe(true);
  });

  it('GET /api/v1/products/:slug - should return full product details by canonical slug', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${testProduct.slug}`)
      .expect(200);

    expect(res.body.id).toBe(testProduct.id);
    expect(res.body.slug).toBe(testProduct.slug);
    expect(res.body.variants.length).toBe(1);
    expect(res.body.variants[0].sku).toBe(`PUB-PH-${suffix}`);
    expect(res.body.variants[0].inStock).toBe(true);
    expect(res.body.variants[0].stockQuantity).toBe(13); // 15 - 2
  });

  it('GET /api/v1/products/:slug - should return 404 for non-existent slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/products/definitely-non-existent-product-slug-xyz')
      .expect(404);
  });

  it('GET /api/v1/products/search-suggestions - should return matching products and categories', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/search-suggestions?q=Public Test Phone`)
      .expect(200);

    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('categories');
    expect(Array.isArray(res.body.products)).toBe(true);
    const found = res.body.products.find((p: any) => p.id === testProduct.id);
    expect(found).toBeDefined();
  });
});
