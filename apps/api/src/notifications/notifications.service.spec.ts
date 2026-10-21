import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationType, Role } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      notification: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new NotificationsService(prismaMock);
  });

  describe('createNotification', () => {
    it('should throw NotFoundException if recipient user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createNotification({
          userId: 'non-existent',
          type: NotificationType.SYSTEM,
          title: 'System update',
          message: 'Maintenance tonight',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and dispatch an alert to user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: Role.CUSTOMER,
      });

      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.ORDER_STATUS,
        title: 'Order Confirmed',
        message: 'Your order has been confirmed.',
        linkUrl: '/orders/1',
        isRead: false,
        createdAt: new Date(),
        user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com', role: Role.CUSTOMER },
      });

      const result = await service.createNotification({
        userId: 'user-1',
        type: NotificationType.ORDER_STATUS,
        title: 'Order Confirmed',
        message: 'Your order has been confirmed.',
        linkUrl: '/orders/1',
      });

      expect(result.id).toBe('notif-1');
      expect(result.isRead).toBe(false);
      expect(result.type).toBe(NotificationType.ORDER_STATUS);
    });
  });

  describe('broadcastNotification', () => {
    it('should broadcast message to target role users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ]);

      prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await service.broadcastNotification({
        targetRole: Role.CUSTOMER,
        type: NotificationType.PROMOTION,
        title: 'Flash Sale',
        message: 'Get 20% off',
      });

      expect(result.success).toBe(true);
      expect(result.dispatchedCount).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should toggle isRead flag to true', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });

      prismaMock.notification.update.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.SYSTEM,
        title: 'Alert',
        message: 'Test',
        linkUrl: null,
        isRead: true,
        createdAt: new Date(),
      });

      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result.isRead).toBe(true);
    });
  });
});
