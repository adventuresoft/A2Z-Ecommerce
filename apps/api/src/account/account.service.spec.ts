import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountService } from './account.service.js';
import { AccountController } from './account.controller.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AccountService and Controller', () => {
  let prismaMock: any;
  let passwordServiceMock: any;
  let service: AccountService;
  let controller: AccountController;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    passwordServiceMock = {
      verify: vi.fn(),
      hash: vi.fn(),
    };
    service = new AccountService(prismaMock, passwordServiceMock);
    controller = new AccountController(service);
  });

  describe('AccountService', () => {
    it('should return profile for existing user', async () => {
      const mockProfile = {
        id: 'u-1',
        email: 'customer@az.local',
        name: 'Customer Name',
        phone: '+8801700000000',
        role: Role.CUSTOMER,
        createdAt: new Date(),
      };
      prismaMock.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile('u-1');
      expect(result).toEqual(mockProfile);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update user name and phone', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
      const updated = {
        id: 'u-1',
        email: 'customer@az.local',
        name: 'New Name',
        phone: '+8801999999999',
        role: Role.CUSTOMER,
        createdAt: new Date(),
      };
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('u-1', {
        name: 'New Name',
        phone: '+8801999999999',
      });
      expect(result).toEqual(updated);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { name: 'New Name', phone: '+8801999999999' },
        select: expect.any(Object),
      });
    });

    it('should change password and increment tokenVersion when current password matches', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        passwordHash: 'old-hash',
      });
      passwordServiceMock.verify.mockResolvedValue(true);
      passwordServiceMock.hash.mockResolvedValue('new-hash');
      prismaMock.user.update.mockResolvedValue({ id: 'u-1' });

      const result = await service.changePassword('u-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toContain('Password changed successfully');
      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'old-hash',
        'OldPassword123!',
      );
      expect(passwordServiceMock.hash).toHaveBeenCalledWith('NewPassword123!');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: {
          passwordHash: 'new-hash',
          tokenVersion: { increment: 1 },
        },
      });
    });

    it('should throw BadRequestException if current password verification fails', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-1',
        passwordHash: 'old-hash',
      });
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        service.changePassword('u-1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return aggregated account overview with counts and recent orders', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
      prismaMock.order = {
        count: vi.fn().mockResolvedValue(4),
        groupBy: vi.fn().mockResolvedValue([
          { orderStatus: 'PENDING', _count: { _all: 2 } },
          { orderStatus: 'CONFIRMED', _count: { _all: 1 } },
          { orderStatus: 'DELIVERED', _count: { _all: 1 } },
        ]),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ord-1',
            orderNumber: 'AZ-2026-X8K2M9',
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
            shipmentStatus: 'UNFULFILLED',
            grandTotal: 1500,
            createdAt: new Date('2026-10-25T10:00:00Z'),
            items: [
              {
                productTitle: 'Smart Watch',
                quantity: 2,
                variant: {
                  imageUrl: 'https://img.test/watch.jpg',
                },
              },
            ],
          },
        ]),
      };
      prismaMock.userAddress = {
        findFirst: vi.fn().mockResolvedValue({
          id: 'addr-1',
          recipientName: 'John Doe',
          phone: '+8801700000000',
          streetAddress: 'Road 5',
          city: 'Dhaka',
          state: 'Dhaka',
          postalCode: '1209',
          country: 'Bangladesh',
        }),
      };

      const overview = await service.getAccountOverview('u-1');
      expect(overview.counts.totalOrders).toBe(4);
      expect(overview.counts.pendingOrders).toBe(2);
      expect(overview.counts.processingOrders).toBe(1);
      expect(overview.counts.deliveredOrders).toBe(1);
      expect(overview.recentOrders).toHaveLength(1);
      expect(overview.recentOrders[0].orderNumber).toBe('AZ-2026-X8K2M9');
      expect(overview.recentOrders[0].itemCount).toBe(2);
      expect(overview.recentOrders[0].itemsPreview[0].productTitle).toBe('Smart Watch');
      expect(overview.defaultShippingAddress?.city).toBe('Dhaka');
    });
  });

  describe('AccountController', () => {
    it('should get overview from current user', async () => {
      const mockUser = { sub: 'u-1', email: 'c@az.local', role: Role.CUSTOMER };
      const mockOverview = {
        counts: {
          totalOrders: 1,
          pendingOrders: 1,
          processingOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
        },
        recentOrders: [],
        defaultShippingAddress: null,
      };
      vi.spyOn(service, 'getAccountOverview').mockResolvedValue(mockOverview as any);

      const res = await controller.getOverview(mockUser);
      expect(res).toEqual(mockOverview);
      expect(service.getAccountOverview).toHaveBeenCalledWith('u-1');
    });

    it('should get profile from current user', async () => {
      const mockUser = { sub: 'u-1', email: 'c@az.local', role: Role.CUSTOMER };
      const mockProfile = { id: 'u-1', name: 'John' };
      vi.spyOn(service, 'getProfile').mockResolvedValue(mockProfile as any);

      const res = await controller.getProfile(mockUser);
      expect(res).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith('u-1');
    });

    it('should update profile and return result', async () => {
      const mockUser = { sub: 'u-1', email: 'c@az.local', role: Role.CUSTOMER };
      const dto = { name: 'Updated' };
      vi.spyOn(service, 'updateProfile').mockResolvedValue(dto as any);

      const res = await controller.updateProfile(mockUser, dto);
      expect(res).toEqual(dto);
      expect(service.updateProfile).toHaveBeenCalledWith('u-1', dto);
    });

    it('should change password and clear refresh cookie', async () => {
      const mockUser = { sub: 'u-1', email: 'c@az.local', role: Role.CUSTOMER };
      const dto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };
      const resMock = { clearCookie: vi.fn() } as any;
      vi.spyOn(service, 'changePassword').mockResolvedValue({
        message: 'Password changed successfully. Please log in again.',
      });

      const res = await controller.changePassword(mockUser, dto, resMock);
      expect(res.message).toContain('Password changed successfully');
      expect(resMock.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
      );
    });
  });
});

