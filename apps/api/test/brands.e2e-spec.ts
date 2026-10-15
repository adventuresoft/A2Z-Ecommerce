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

describe('Brands API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now().toString();

  const testAdmin = {
    email: `admin_brand_${suffix}@az.local`,
    password: 'AdminPassword123!',
    name: 'Brand Admin Tester',
  };

  const testCustomer = {
    email: `customer_brand_${suffix}@az.local`,
    password: 'CustomerPassword123!',
    name: 'Customer Tester',
  };

  let adminToken: string;
  let customerToken: string;
  const createdBrandIds: string[] = [];

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
        role: Role.ADMIN,
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
  });

  afterAll(async () => {
    try {
      if (createdBrandIds.length > 0) {
        await prisma.brand.deleteMany({
          where: { id: { in: createdBrandIds } },
        });
      }
      await prisma.user.deleteMany({
        where: { email: { in: [testAdmin.email, testCustomer.email] } },
      });
    } catch {
      // ignore
    }
    await app.close();
  });

  describe('Authorization Safeguards', () => {
    it('GET /api/v1/admin/brands - should reject unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/brands')
        .expect(401);
    });

    it('GET /api/v1/admin/brands - should reject CUSTOMER token with 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Admin Brand Management Endpoints', () => {
    let brand1Id: string;
    let brand2Id: string;
    let inactiveBrandId: string;

    it('POST /api/v1/admin/brands - creates brand without slug and auto-generates slug', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Brand ${suffix}`,
          description: 'A test brand',
          website: 'https://example.com',
          sortOrder: 1,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.slug).toBe(`test-brand-${suffix}`);
      expect(res.body.isActive).toBe(true);
      expect(res.body.counts).toEqual({ products: 0 });
      brand1Id = res.body.id;
      createdBrandIds.push(brand1Id);
    });

    it('POST /api/v1/admin/brands - auto-resolves slug collision with suffix', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Brand ${suffix}`,
        })
        .expect(201);

      expect(res.body.slug).toBe(`test-brand-${suffix}-1`);
      brand2Id = res.body.id;
      createdBrandIds.push(brand2Id);
    });

    it('POST /api/v1/admin/brands - rejects duplicate explicit slug with 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Different Name',
          slug: `test-brand-${suffix}`,
        })
        .expect(409);
    });

    it('PUT /api/v1/admin/brands/:id - renaming brand preserves existing slug when slug not provided', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/admin/brands/${brand1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Renamed Brand ${suffix}`,
        })
        .expect(200);

      expect(res.body.name).toBe(`Renamed Brand ${suffix}`);
      expect(res.body.slug).toBe(`test-brand-${suffix}`);
    });

    it('POST /api/v1/admin/brands - create inactive brand', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Inactive Brand ${suffix}`,
          isActive: false,
          sortOrder: 99,
        })
        .expect(201);

      expect(res.body.isActive).toBe(false);
      inactiveBrandId = res.body.id;
      createdBrandIds.push(inactiveBrandId);
    });

    it('GET /api/v1/admin/brands?isActive=false - filters inactive brands', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/brands?isActive=false&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      const found = res.body.items.find(
        (b: any) => b.id === inactiveBrandId,
      );
      expect(found).toBeDefined();
      expect(found.isActive).toBe(false);
    });

    it('POST /api/v1/admin/brands/upload-logo - uploads valid image successfully', async () => {
      // 1x1 transparent PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/brands/upload-logo')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', pngBuffer, 'test-logo.png')
        .expect(201);

      expect(res.body.logoUrl).toMatch(/^\/uploads\/brands\/brand_.*\.png$/);
      expect(res.body.filename).toMatch(/^brand_.*\.png$/);
    });

    it('POST /api/v1/admin/brands/upload-logo - rejects non-image file with 400', async () => {
      const textBuffer = Buffer.from('Plain text file content');

      await request(app.getHttpServer())
        .post('/api/v1/admin/brands/upload-logo')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', textBuffer, 'document.txt')
        .expect(400);
    });

    it('POST /api/v1/admin/brands/upload-logo - rejects oversized file (> 5MB)', async () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/brands/upload-logo')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', bigBuffer, 'huge.png');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Category Image Upload Refactor Verification', () => {
    it('POST /api/v1/admin/categories/upload-image - works with shared upload helper', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', pngBuffer, 'cat-logo.png')
        .expect(201);

      expect(res.body.imageUrl).toMatch(/^\/uploads\/categories\/cat_.*\.png$/);
      expect(res.body.filename).toMatch(/^cat_.*\.png$/);
    });
  });

  describe('Public Brand Endpoints', () => {
    it('GET /api/v1/brands - returns only active brands ordered by sortOrder then name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/brands')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      // All items must have public shape (no isActive or timestamps)
      for (const item of res.body) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('slug');
        expect(item).not.toHaveProperty('isActive');
        expect(item).not.toHaveProperty('createdAt');
      }

      // Inactive brand should NOT be in the public list
      const inactive = res.body.find(
        (b: any) => b.slug === `inactive-brand-${suffix}`,
      );
      expect(inactive).toBeUndefined();
    });

    it('GET /api/v1/brands/:slug - returns active brand details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/brands/test-brand-${suffix}`)
        .expect(200);

      expect(res.body.name).toBe(`Renamed Brand ${suffix}`);
      expect(res.body.slug).toBe(`test-brand-${suffix}`);
    });

    it('GET /api/v1/brands/:slug - returns 404 for inactive brand', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/brands/inactive-brand-${suffix}`)
        .expect(404);
    });

    it('GET /api/v1/brands/:slug - returns 404 for non-existent brand', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/brands/completely-unknown-slug-xyz')
        .expect(404);
    });
  });

  describe('Brand Deletion Safeguards', () => {
    it('DELETE /api/v1/admin/brands/:id - returns 404 for missing brand', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/brands/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('DELETE /api/v1/admin/brands/:id - deletes unreferenced brand successfully', async () => {
      const brandToDelete = createdBrandIds[createdBrandIds.length - 1];
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/brands/${brandToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        message: expect.stringContaining('deleted successfully'),
      });

      // Verify it's really gone
      await request(app.getHttpServer())
        .get(`/api/v1/admin/brands/${brandToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
