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

describe('Categories API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now().toString();

  const testAdmin = {
    email: `admin_cat_${suffix}@az.local`,
    password: 'AdminPassword123!',
    name: 'Admin Tester',
  };

  let adminToken: string;
  let rootCatId: string;
  let subCatId: string;
  let leafCatId: string;

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
    const passwordHash = await argon2.hash(testAdmin.password);
    await prisma.user.create({
      data: {
        email: testAdmin.email,
        passwordHash,
        name: testAdmin.name,
        role: Role.ADMIN,
      },
    });

    // Login as admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password })
      .expect(200);

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup created test categories & user
    try {
      if (leafCatId) await prisma.category.deleteMany({ where: { id: leafCatId } });
      if (subCatId) await prisma.category.deleteMany({ where: { id: subCatId } });
      if (rootCatId) await prisma.category.deleteMany({ where: { id: rootCatId } });
      await prisma.user.deleteMany({ where: { email: testAdmin.email } });
    } catch {
      // ignore
    }
    await app.close();
  });

  describe('Authorization Safeguards', () => {
    it('GET /api/v1/admin/categories - should reject unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/categories')
        .expect(401);
    });
  });

  describe('Admin Category Management (Hierarchy & Validation)', () => {
    it('POST /api/v1/admin/categories - should create a Level 1 Root Category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Electronics ${suffix}`,
          description: 'All consumer electronics',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(`Electronics ${suffix}`);
      expect(res.body.slug).toContain('electronics');
      expect(res.body.parentId).toBeNull();
      rootCatId = res.body.id;
    });

    it('POST /api/v1/admin/categories - should create a Level 2 Subcategory', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Laptops ${suffix}`,
          parentId: rootCatId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.parentId).toBe(rootCatId);
      subCatId = res.body.id;
    });

    it('POST /api/v1/admin/categories - should create a Level 3 Leaf Category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Gaming Laptops ${suffix}`,
          parentId: subCatId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.parentId).toBe(subCatId);
      leafCatId = res.body.id;
    });

    it('POST /api/v1/admin/categories - should reject creating a Level 4 Category with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Ultra High End ${suffix}`,
          parentId: leafCatId, // Level 3 parent -> would be Level 4
        })
        .expect(400);

      expect(res.body.message).toContain('3 levels of depth');
    });

    it('DELETE /api/v1/admin/categories/:id - should reject deleting category with children with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/categories/${rootCatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.message).toContain('subcategories');
    });

    it('GET /api/v1/admin/categories/parent-options - should return only Level 1 and 2 categories', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/categories/parent-options?excludeId=${leafCatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // All options must be depth 1 or 2
      for (const opt of res.body) {
        expect(opt.depth).toBeLessThan(3);
      }
    });

    it('GET /api/v1/admin/categories - should list paginated categories with metadata', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/categories?search=Electronics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('Public Storefront Endpoints', () => {
    it('GET /api/v1/categories/tree - should return active categories as a nested tree', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories/tree')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const rootNode = res.body.find((n: any) => n.id === rootCatId);
      expect(rootNode).toBeDefined();
      expect(rootNode.children.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/categories/:slug - should return category details with breadcrumbs', async () => {
      // First get leaf category slug
      const leaf = await prisma.category.findUnique({ where: { id: leafCatId } });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/categories/${leaf!.slug}`)
        .expect(200);

      expect(res.body.id).toBe(leafCatId);
      expect(res.body.breadcrumbs).toHaveLength(3);
      expect(res.body.breadcrumbs[0].id).toBe(rootCatId);
      expect(res.body.breadcrumbs[1].id).toBe(subCatId);
      expect(res.body.breadcrumbs[2].id).toBe(leafCatId);
    });
  });

  describe('Deletion Lifecycle', () => {
    it('DELETE /api/v1/admin/categories/:id - should delete an empty leaf category', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/categories/${leafCatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deletion from DB
      const check = await prisma.category.findUnique({ where: { id: leafCatId } });
      expect(check).toBeNull();
    });
  });
});
