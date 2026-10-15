import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { BrandsAdminController } from './brands.admin.controller.js';
import { BrandsPublicController } from './brands.public.controller.js';

describe('Brands Controllers', () => {
  let adminController: BrandsAdminController;
  let publicController: BrandsPublicController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      create: vi.fn(),
      findAllAdmin: vi.fn(),
      findOneAdmin: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      findAllPublic: vi.fn(),
      findBySlug: vi.fn(),
    };

    adminController = new BrandsAdminController(serviceMock);
    publicController = new BrandsPublicController(serviceMock);
  });

  describe('BrandsAdminController', () => {
    it('should have JwtAuthGuard and RolesGuard metadata', () => {
      const guards = Reflect.getMetadata('__guards__', BrandsAdminController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should have ADMIN and SUPER_ADMIN roles metadata', () => {
      const roles = Reflect.getMetadata('roles', BrandsAdminController);
      expect(roles).toBeDefined();
      expect(roles).toEqual([Role.ADMIN, Role.SUPER_ADMIN]);
    });

    it('should handle logo upload with valid file', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'samsung-logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 10240,
        destination: 'uploads/brands',
        filename: 'brand_123.png',
        path: 'uploads/brands/brand_123.png',
        buffer: Buffer.from(''),
        stream: null as any,
      };

      const result = await adminController.uploadLogo(mockFile);
      expect(result).toEqual({
        logoUrl: '/uploads/brands/brand_123.png',
        filename: 'brand_123.png',
        originalName: 'samsung-logo.png',
        size: 10240,
      });
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      await expect(adminController.uploadLogo(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delegate create to service', async () => {
      const dto = { name: 'Samsung' };
      const expected = { id: 'b-1', name: 'Samsung', slug: 'samsung' };
      serviceMock.create.mockResolvedValueOnce(expected);

      const result = await adminController.create(dto);
      expect(result).toEqual(expected);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });

    it('should delegate findAll to service', async () => {
      const query = { page: 1, limit: 10, search: 'sam' };
      const expected = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      serviceMock.findAllAdmin.mockResolvedValueOnce(expected);

      const result = await adminController.findAll(query);
      expect(result).toEqual(expected);
      expect(serviceMock.findAllAdmin).toHaveBeenCalledWith(query);
    });

    it('should delegate findOne to service', async () => {
      const expected = { id: 'b-1', name: 'Samsung' };
      serviceMock.findOneAdmin.mockResolvedValueOnce(expected);

      const result = await adminController.findOne('b-1');
      expect(result).toEqual(expected);
      expect(serviceMock.findOneAdmin).toHaveBeenCalledWith('b-1');
    });

    it('should delegate update to service', async () => {
      const dto = { name: 'Samsung Electronics' };
      const expected = { id: 'b-1', name: 'Samsung Electronics' };
      serviceMock.update.mockResolvedValueOnce(expected);

      const result = await adminController.update('b-1', dto);
      expect(result).toEqual(expected);
      expect(serviceMock.update).toHaveBeenCalledWith('b-1', dto);
    });

    it('should delegate remove to service', async () => {
      const expected = { success: true, message: 'Brand deleted' };
      serviceMock.remove.mockResolvedValueOnce(expected);

      const result = await adminController.remove('b-1');
      expect(result).toEqual(expected);
      expect(serviceMock.remove).toHaveBeenCalledWith('b-1');
    });
  });

  describe('BrandsPublicController', () => {
    it('should list active brands', async () => {
      const expected = [
        { id: 'b-1', name: 'Apple', slug: 'apple', sortOrder: 1 },
      ];
      serviceMock.findAllPublic.mockResolvedValueOnce(expected);

      const result = await publicController.findAll();
      expect(result).toEqual(expected);
      expect(serviceMock.findAllPublic).toHaveBeenCalled();
    });

    it('should get brand by slug', async () => {
      const expected = { id: 'b-1', name: 'Apple', slug: 'apple', sortOrder: 1 };
      serviceMock.findBySlug.mockResolvedValueOnce(expected);

      const result = await publicController.findBySlug('apple');
      expect(result).toEqual(expected);
      expect(serviceMock.findBySlug).toHaveBeenCalledWith('apple');
    });

    it('should propagate NotFoundException when brand is not found or inactive', async () => {
      serviceMock.findBySlug.mockRejectedValueOnce(
        new NotFoundException('Brand not found or is inactive'),
      );

      await expect(publicController.findBySlug('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
