import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication<App>;
  const uniqueSuffix = Date.now().toString();
  const testCustomer = {
    email: `customer_${uniqueSuffix}@az-ecommerce.local`,
    password: 'CustomerPass123!',
    name: 'Test Customer',
    phone: '+8801700000000',
  };

  let customerAccessToken: string;
  let customerRefreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Customer Registration', () => {
    it('POST /api/v1/auth/register - should register a new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testCustomer)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testCustomer.email);
      expect(response.body.name).toBe(testCustomer.name);
      expect(response.body.role).toBe('CUSTOMER');
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('POST /api/v1/auth/register - should reject duplicate email with 409 Conflict', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testCustomer)
        .expect(409);

      expect(response.body.message).toContain('already registered');
    });

    it('POST /api/v1/auth/register - should reject weak password with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid@az.local',
          password: 'short',
          name: 'Invalid User',
        })
        .expect(400);
    });
  });

  describe('User Login', () => {
    it('POST /api/v1/auth/login - should authenticate customer and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testCustomer.email,
          password: testCustomer.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testCustomer.email);
      expect(response.body.user.role).toBe('CUSTOMER');

      customerAccessToken = response.body.accessToken;
      customerRefreshToken = response.body.refreshToken;
    });

    it('POST /api/v1/auth/login - should reject invalid credentials with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testCustomer.email,
          password: 'WrongPassword!',
        })
        .expect(401);
    });

    it('POST /api/v1/auth/login - should authenticate seeded super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@az-ecommerce.local',
          password: 'Admin123456!',
        })
        .expect(200);

      expect(response.body.user.role).toBe('SUPER_ADMIN');
    });
  });

  describe('Authenticated Profile & Token Rotation', () => {
    it('GET /api/v1/auth/me - should return customer profile when Bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testCustomer.email);
      expect(response.body.role).toBe('CUSTOMER');
    });

    it('GET /api/v1/auth/me - should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('POST /api/v1/auth/refresh - should rotate refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: customerRefreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Update tokens
      customerAccessToken = response.body.accessToken;
      customerRefreshToken = response.body.refreshToken;
    });

    it('POST /api/v1/auth/logout - should invalidate refresh tokens via tokenVersion', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      // Subsequent refresh with the old token MUST fail with 401
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: customerRefreshToken })
        .expect(401);
    });
  });
});
