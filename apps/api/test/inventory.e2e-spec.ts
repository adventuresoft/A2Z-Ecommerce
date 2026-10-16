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

describe('Inventory & Stock Management API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now().toString();

  const testAdmin = {
    email: `admin_inv_${suffix}@az.local`,
    password: 'AdminPassword123!',
    name: 'Inventory Admin Tester',
  };

  const testCustomer = {
    email: `customer_inv_${suffix}@az.local`,
    password: 'CustomerPassword123!',
    name: 'Customer Tester',
  };

  let adminToken: string;
  let customerToken: string;

  let testCategory: { id: string; name: string; slug: string };
  let testProduct: any;
  let testVariant: any;

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
    const adminHash = await argon2.hash(testAdmin.password);
    const adminUser = await prisma.user.create({
      data: {
        email: testAdmin.email,
        passwordHash: adminHash,
        name: testAdmin.name,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    // Create customer user
    const custHash = await argon2.hash(testCustomer.password);
    await prisma.user.create({
      data: {
        email: testCustomer.email,
        passwordHash: custHash,
        name: testCustomer.name,
        role: Role.CUSTOMER,
        isActive: true,
      },
    });

    // Login admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password });
    adminToken = adminLoginRes.body.accessToken;

    // Login customer
    const custLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testCustomer.email, password: testCustomer.password });
    customerToken = custLoginRes.body.accessToken;

    // Create category
    testCategory = await prisma.category.create({
      data: {
        name: `Inv Cat ${suffix}`,
        slug: `inv-cat-${suffix}`,
      },
    });

    // Create product with variant through products API
    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Inventory Test Product ${suffix}`,
        categoryId: testCategory.id,
        description: 'Product for inventory e2e verification',
        variants: [
          {
            sku: `INV-SKU-${suffix}`,
            regularPrice: 99.99,
          },
        ],
      });

    expect(prodRes.status).toBe(201);
    testProduct = prodRes.body;
    testVariant = prodRes.body.variants[0];
  });

  afterAll(async () => {
    try {
      if (testProduct) {
        await prisma.stockMovement.deleteMany({
          where: { variant: { productId: testProduct.id } },
        });
        await prisma.inventory.deleteMany({
          where: { variant: { productId: testProduct.id } },
        });
        await prisma.product.deleteMany({
          where: { id: testProduct.id },
        });
      }
      if (testCategory) {
        await prisma.category.deleteMany({
          where: { id: testCategory.id },
        });
      }
      await prisma.user.deleteMany({
        where: { email: { in: [testAdmin.email, testCustomer.email] } },
      });
      await app.close();
    } catch {
      // Cleanup best-effort
    }
  });

  it('1. should reject unauthenticated and customer access with 401 and 403', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/inventory')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('2. should automatically initialize an Inventory record for the newly created variant', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/inventory/${testVariant.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.variantId).toBe(testVariant.id);
    expect(res.body.quantity).toBe(0);
    expect(res.body.reservedQuantity).toBe(0);
    expect(res.body.availableQuantity).toBe(0);
    expect(res.body.lowStockThreshold).toBe(5);
    expect(res.body.isOutOfStock).toBe(true);
  });

  it('3. should list the variant in low-stock alerts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/inventory/low-stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.lowStockCount).toBeGreaterThan(0);
    const item = res.body.items.find((i: any) => i.variantId === testVariant.id);
    expect(item).toBeDefined();
    expect(item.sku).toBe(`INV-SKU-${suffix}`);
  });

  it('4. should restock the variant with positive delta and record in audit movements', async () => {
    const adjustRes = await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variantId: testVariant.id,
        type: 'RESTOCK',
        quantityChange: 50,
        referenceId: `PO-E2E-${suffix}`,
        notes: 'Initial warehouse inward shipment',
      })
      .expect(200);

    expect(adjustRes.body.quantity).toBe(50);
    expect(adjustRes.body.availableQuantity).toBe(50);
    expect(adjustRes.body.isLowStock).toBe(false);
    expect(adjustRes.body.isOutOfStock).toBe(false);

    // Verify movements ledger
    const movRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/inventory/movements?variantId=${testVariant.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(movRes.body.data.length).toBeGreaterThan(0);
    const movement = movRes.body.data[0];
    expect(movement.type).toBe('RESTOCK');
    expect(movement.quantityChange).toBe(50);
    expect(movement.previousQuantity).toBe(0);
    expect(movement.newQuantity).toBe(50);
    expect(movement.referenceId).toBe(`PO-E2E-${suffix}`);
  });

  it('5. should reject negative stock outcome with 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variantId: testVariant.id,
        type: 'DAMAGED',
        quantityChange: -100, // on-hand is 50, cannot deduct 100
      })
      .expect(400);
  });

  it('6. should update the low-stock alert threshold', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/inventory/${testVariant.id}/threshold`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lowStockThreshold: 15 })
      .expect(200);

    expect(res.body.lowStockThreshold).toBe(15);
  });
});
