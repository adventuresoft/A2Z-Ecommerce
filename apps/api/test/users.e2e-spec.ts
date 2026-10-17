import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Admin Users, Roles & Permissions Management (e2e)', () => {
  let app: INestApplication<App>;
  let superAdminToken: string;
  let createdUserId: string;
  let createdRoleId: string;
  let createdPermissionId: string;

  const uniqueSuffix = Date.now().toString().slice(-6);

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

    // Login as seeded SuperAdmin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@az-ecommerce.local',
        password: 'Password123!',
      })
      .expect(200);

    superAdminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Users Directory API', () => {
    it('GET /api/v1/admin/users - should retrieve paginated list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.page).toBe(1);
    });

    it('POST /api/v1/admin/users - should create a new administrative user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: `staff_${uniqueSuffix}@az-ecommerce.local`,
          name: `Staff Member ${uniqueSuffix}`,
          password: 'Password123!',
          phone: '+880172868595',
          role: 'ADMIN',
          department: 'Human Resource Management',
          section: 'Establishment Section',
          location: 'Dhaka (District) - District: Dhaka',
          isActive: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(`staff_${uniqueSuffix}@az-ecommerce.local`);
      expect(res.body.department).toBe('Human Resource Management');
      createdUserId = res.body.id;
    });

    it('GET /api/v1/admin/users/:id - should retrieve user profile by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdUserId);
      expect(res.body.phone).toBe('+880172868595');
    });

    it('PATCH /api/v1/admin/users/:id - should update user profile', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: `Updated Staff ${uniqueSuffix}`,
          location: 'Chittagong, Bangladesh',
        })
        .expect(200);

      expect(res.body.name).toBe(`Updated Staff ${uniqueSuffix}`);
      expect(res.body.location).toBe('Chittagong, Bangladesh');
    });
  });

  describe('Security Roles Management API', () => {
    it('GET /api/v1/admin/roles - should retrieve all registered roles with ability matrices', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
      const superAdminRole = res.body.find((r: any) => r.slug === 'superadmin');
      expect(superAdminRole).toBeDefined();
      expect(superAdminRole.isSystem).toBe(true);
      expect(superAdminRole.capabilities).toBeDefined();
    });

    it('POST /api/v1/admin/roles - should create a new custom security role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: `Finance Manager ${uniqueSuffix}`,
          slug: `finance_manager_${uniqueSuffix}`,
          description: 'Access to financial setups and basic configurations',
          permissions: ['orders.read', 'payments.read', 'reports.read'],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(`Finance Manager ${uniqueSuffix}`);
      expect(res.body.permissionCount).toBe(3);
      createdRoleId = res.body.id;
    });

    it('PATCH /api/v1/admin/roles/:id - should update custom role permissions', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: ['orders.read', 'payments.read', 'reports.read', 'products.read'],
        })
        .expect(200);

      expect(res.body.permissionCount).toBe(4);
    });

    it('DELETE /api/v1/admin/roles/:id - should delete custom role', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Global Permissions Registry API', () => {
    it('GET /api/v1/admin/permissions - should list all registered permissions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const userRead = res.body.find((p: any) => p.key === 'user.read');
      expect(userRead).toBeDefined();
      expect(userRead.isSystem).toBe(true);
    });

    it('POST /api/v1/admin/permissions - should register a new permission descriptor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: `custom.report_${uniqueSuffix}`,
          name: 'Custom Financial Report',
          module: 'reports',
          action: 'read',
          description: 'Permission to export specialized financial statement',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.key).toBe(`custom.report_${uniqueSuffix}`);
      createdPermissionId = res.body.id;
    });

    it('DELETE /api/v1/admin/permissions/:id - should delete custom permission', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/permissions/${createdPermissionId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Cleanup & Safety Constraints', () => {
    it('DELETE /api/v1/admin/users/:id - should delete created staff user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
