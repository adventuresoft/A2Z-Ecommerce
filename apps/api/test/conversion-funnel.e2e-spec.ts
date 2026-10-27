import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../src/prisma/index.js';

describe('Complete Conversion Funnel E2E (Browse -> Cart -> Wishlist -> Register -> Merge -> Calculate -> Checkout -> History -> Cancel)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const timestamp = Date.now().toString();
  const customerEmail = `funnel_${timestamp}@az-ecommerce.local`;
  const customerPassword = 'SecurePassword123!';
  const idempotencyKey = `idemp_${timestamp}`;

  let targetProductId: string;
  let targetProductSlug: string;
  let targetVariantId: string;
  let targetVariantPrice: number;
  let initialStockAvailable: number;

  let customerAccessToken: string;
  let customerAddressId: string;
  let shippingMethodId: string;
  let placedOrderId: string;
  let placedOrderNumber: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
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

    // Ensure we have at least one active shipping method
    const zone = await prisma.shippingZone.findFirst({
      where: { isActive: true },
      include: { methods: { where: { isActive: true } } },
    });
    if (zone?.methods?.length) {
      shippingMethodId = zone.methods[0].id;
    } else {
      const createdZone = await prisma.shippingZone.create({
        data: {
          name: `Test Zone ${timestamp}`,
          isActive: true,
          methods: {
            create: {
              name: 'Standard Test Delivery',
              cost: 60.0,
              isActive: true,
            },
          },
        },
        include: { methods: true },
      });
      shippingMethodId = createdZone.methods[0].id;
    }

    // Ensure active test coupon exists
    await prisma.coupon.upsert({
      where: { code: 'FUNNEL500' },
      update: {
        isActive: true,
        minOrderAmount: 100,
        discountType: 'FIXED_AMOUNT',
        discountValue: 500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2028-12-31'),
      },
      create: {
        code: 'FUNNEL500',
        description: 'Conversion Funnel Test Coupon 500 BDT off',
        isActive: true,
        minOrderAmount: 100,
        discountType: 'FIXED_AMOUNT',
        discountValue: 500,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2028-12-31'),
      },
    });
  });

  afterAll(async () => {
    if (placedOrderId) {
      try {
        await prisma.orderItem.deleteMany({ where: { orderId: placedOrderId } });
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: placedOrderId } });
        await prisma.couponUsage.deleteMany({ where: { orderId: placedOrderId } });
        await prisma.order.delete({ where: { id: placedOrderId } });
      } catch {
        // cleanup best-effort
      }
    }
    await app.close();
  });

  it('Step 1: Browse Public Catalog (GET /api/v1/products)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products?page=1&limit=10')
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);

    // Pick an active product from catalog
    const product = res.body.items[0];
    expect(product).toBeDefined();
    expect(product.id).toBeDefined();
    expect(product.slug).toBeDefined();

    targetProductId = product.id;
    targetProductSlug = product.slug;
  });

  it('Step 2: Inspect PDP by Slug (GET /api/v1/products/:slug)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${targetProductSlug}`)
      .expect(200);

    expect(res.body.id).toBe(targetProductId);
    expect(res.body.slug).toBe(targetProductSlug);
    expect(res.body.variants).toBeDefined();
    expect(res.body.variants.length).toBeGreaterThan(0);

    const variant = res.body.variants[0];
    targetVariantId = variant.id;

    // Ensure variant has a valid active price
    await prisma.productVariant.update({
      where: { id: targetVariantId },
      data: {
        regularPrice: 2000,
        salePrice: 1500,
        isActive: true,
      },
    });
    targetVariantPrice = 1500;

    // Ensure sufficient inventory exists for the test variant
    const inv = await prisma.inventory.findUnique({
      where: { variantId: targetVariantId },
    });
    if (!inv || inv.quantity < 10) {
      await prisma.inventory.upsert({
        where: { variantId: targetVariantId },
        update: { quantity: 50, reservedQuantity: 0 },
        create: {
          variantId: targetVariantId,
          quantity: 50,
          reservedQuantity: 0,
        },
      });
      initialStockAvailable = 50;
    } else {
      initialStockAvailable = inv.quantity - inv.reservedQuantity;
    }
    expect(initialStockAvailable).toBeGreaterThan(0);
  });

  it('Step 3 & 4: Register as New Customer (POST /api/v1/auth/register)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: customerEmail,
        password: customerPassword,
        name: 'Funnel Shopper',
        phone: '+8801755554444',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.email).toBe(customerEmail);
    customerAccessToken = res.body.accessToken;
  });

  it('Step 5: Wishlist Sync / Merge (POST /api/v1/wishlist/sync)', async () => {
    // Guest had favorited targetProductId before signing in
    const res = await request(app.getHttpServer())
      .post('/api/v1/wishlist/sync')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ productIds: [targetProductId] })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((item: any) => item.productId === targetProductId)).toBe(true);

    // Verify GET /api/v1/wishlist returns the merged product
    const getRes = await request(app.getHttpServer())
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    expect(getRes.body.some((item: any) => item.productId === targetProductId)).toBe(true);
  });

  it('Step 6: Create Delivery Address (POST /api/v1/account/addresses)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account/addresses')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        label: 'Home',
        recipientName: 'Funnel Shopper',
        phone: '+8801755554444',
        streetAddress: 'Plot 14, Road 8, Block G, Bashundhara R/A',
        city: 'Dhaka',
        postalCode: '1229',
        isDefaultShipping: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.city).toBe('Dhaka');
    customerAddressId = res.body.id;
  });

  it('Step 7: Pre-checkout Authoritative Calculation with Coupon (POST /api/v1/checkout/calculate)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/checkout/calculate')
      .send({
        items: [{ variantId: targetVariantId, quantity: 2 }],
        shippingMethodId,
        shippingCity: 'Dhaka',
        couponCode: 'FUNNEL500',
      });

    if (res.status !== 200) {
      console.error('STEP 7 ERROR:', res.status, res.body);
    }
    expect(res.status).toBe(200);

    expect(res.body.subtotal).toBeGreaterThan(0);
    expect(res.body.discountAmount).toBe(500);
    expect(res.body.shippingFee).toBeDefined();
    expect(res.body.grandTotal).toBeDefined();
    expect(res.body.coupon).toBeDefined();
    expect(res.body.coupon.code).toBe('FUNNEL500');
    expect(res.body.itemsValidation[0].isValid).toBe(true);
  });

  it('Step 8: Place Order via Transactional Checkout (POST /api/v1/orders)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        recipientName: 'Funnel Shopper',
        recipientPhone: '+8801755554444',
        shippingStreet: 'Plot 14, Road 8, Block G, Bashundhara R/A',
        shippingCity: 'Dhaka',
        shippingPostalCode: '1229',
        shippingMethodId,
        couponCode: 'FUNNEL500',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ variantId: targetVariantId, quantity: 2 }],
      });

    if (res.status !== 201) {
      console.error('STEP 8 ERROR:', res.status, res.body);
    }
    expect(res.status).toBe(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.orderNumber).toBeDefined();
    expect(res.body.orderNumber).toMatch(/^AZ-\d{4}-[A-Z0-9]+$/);
    expect(res.body.orderStatus).toBe('PENDING');
    expect(res.body.discountAmount).toBe(500);
    expect(res.body.recipientName).toBe('Funnel Shopper');
    expect(res.body.items.length).toBe(1);

    placedOrderId = res.body.id;
    placedOrderNumber = res.body.orderNumber;

    // Verify inventory reservedQuantity increased by 2
    const postInv = await prisma.inventory.findUnique({
      where: { variantId: targetVariantId },
    });
    expect(postInv!.reservedQuantity).toBeGreaterThanOrEqual(2);
  });

  it('Step 9: Idempotency Protection Rejects Duplicate Order Submission', async () => {
    // Resubmitting with exact same idempotencyKey returns cached order or conflict
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        recipientName: 'Funnel Shopper',
        recipientPhone: '+8801755554444',
        shippingStreet: 'Plot 14, Road 8, Block G, Bashundhara R/A',
        shippingCity: 'Dhaka',
        shippingPostalCode: '1229',
        shippingMethodId,
        couponCode: 'FUNNEL500',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ variantId: targetVariantId, quantity: 2 }],
      });

    // Idempotent retry returns 200/201 with same order, or 409 conflict
    expect([200, 201, 409]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      expect(res.body.orderNumber).toBe(placedOrderNumber);
    }
  });

  it('Step 10: Inspect Order History & Customer Overview', async () => {
    // GET /api/v1/orders
    const ordersRes = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    expect(ordersRes.body.data).toBeDefined();
    const found = ordersRes.body.data.find((o: any) => o.id === placedOrderId);
    expect(found).toBeDefined();
    expect(found.orderNumber).toBe(placedOrderNumber);

    // GET /api/v1/orders/:id
    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/orders/${placedOrderId}`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    expect(detailRes.body.id).toBe(placedOrderId);
    expect(detailRes.body.orderNumber).toBe(placedOrderNumber);
    expect(detailRes.body.orderStatus).toBe('PENDING');
    expect(detailRes.body.items.length).toBe(1);

    // GET /api/v1/account/overview
    const overviewRes = await request(app.getHttpServer())
      .get('/api/v1/account/overview')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    expect(overviewRes.body.counts).toBeDefined();
    expect(overviewRes.body.counts.totalOrders).toBeGreaterThanOrEqual(1);
    expect(overviewRes.body.counts.pendingOrders).toBeGreaterThanOrEqual(1);
  });

  it('Step 11: Customer Self-Service Cancellation of PENDING Order (POST /api/v1/orders/:id/cancel)', async () => {
    const invBefore = await prisma.inventory.findUnique({
      where: { variantId: targetVariantId },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ reason: 'Changed mind before delivery' })
      .expect(200);

    expect(res.body.id).toBe(placedOrderId);
    expect(res.body.orderStatus).toBe('CANCELLED');

    // Verify inventory stock released (reservedQuantity decremented by 2)
    const invAfter = await prisma.inventory.findUnique({
      where: { variantId: targetVariantId },
    });
    expect(invAfter!.reservedQuantity).toBe(invBefore!.reservedQuantity - 2);
  });

  it('Step 12: Invariant Check: Cancelling an already cancelled order returns 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({ reason: 'Try to cancel again' })
      .expect(400);
  });
});
