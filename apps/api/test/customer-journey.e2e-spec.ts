import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Full Customer Journey E2E', () => {
  let app: INestApplication<App>;
  const unique = Date.now().toString();
  const customerEmail = `journey_${unique}@az-ecommerce.local`;
  const initialPassword = 'InitialPass123!';
  const newPassword = 'ChangedPass456!';

  let accessToken: string;
  let initialRefreshToken: string;
  let firstAddressId: string;
  let secondAddressId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('Step 1: Registration with auto-token and HTTP-only cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: customerEmail,
        password: initialPassword,
        name: 'Journey Tester',
        phone: '+8801700000000',
      })
      .expect(201);

    expect(res.body.email).toBe(customerEmail);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    accessToken = res.body.accessToken;
    initialRefreshToken = res.body.refreshToken;

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieList = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const hasRefreshCookie = cookieList.some((c: string) =>
      c.includes('refreshToken='),
    );
    expect(hasRefreshCookie).toBe(true);
  });

  it('Step 2: Inspect own customer profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/account/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(customerEmail);
    expect(res.body.name).toBe('Journey Tester');
    expect(res.body.role).toBe('CUSTOMER');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('Step 3: Update display name and contact phone', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/account/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Journey Tester',
        phone: '+8801811112222',
      })
      .expect(200);

    expect(res.body.name).toBe('Updated Journey Tester');
    expect(res.body.phone).toBe('+8801811112222');
  });

  it('Step 4: Create first delivery address (auto-default)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'Home',
        recipientName: 'Journey Recipient',
        phone: '+8801811112222',
        streetAddress: 'House 1, Road 2',
        city: 'Dhaka',
        postalCode: '1212',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.isDefaultShipping).toBe(true);
    expect(res.body.isDefaultBilling).toBe(true);
    firstAddressId = res.body.id;
  });

  it('Step 5: Create second address with default shipping', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'Office',
        recipientName: 'Journey Recipient Work',
        phone: '+8801811113333',
        streetAddress: 'Level 5, Tower A',
        city: 'Dhaka',
        postalCode: '1230',
        isDefaultShipping: true,
      })
      .expect(201);

    expect(res.body.isDefaultShipping).toBe(true);
    secondAddressId = res.body.id;

    // Verify first address lost default shipping
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/account/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const first = listRes.body.find((a: any) => a.id === firstAddressId);
    expect(first.isDefaultShipping).toBe(false);
  });

  it('Step 6: Set first address back to default shipping', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/account/addresses/${firstAddressId}/default-shipping`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.isDefaultShipping).toBe(true);
  });

  it('Step 7: Delete second address', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/account/addresses/${secondAddressId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/account/addresses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].id).toBe(firstAddressId);
  });

  it('Step 8: Change password with incorrect current password returns 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/account/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongPassword!',
        newPassword: newPassword,
      })
      .expect(400);
  });

  it('Step 9: Change password successfully and revoke existing refresh tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: initialPassword,
        newPassword: newPassword,
      })
      .expect(200);

    expect(res.body.message).toContain('Password changed successfully');

    // Confirm that old refresh token is now revoked (tokenVersion incremented)
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken })
      .expect(401);
  });

  it('Step 10: Old password fails login, new password succeeds', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customerEmail, password: initialPassword })
      .expect(401);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customerEmail, password: newPassword })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.email).toBe(customerEmail);
  });
});
