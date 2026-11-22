import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { ExpoPushService } from './expo-push.service.js';
import { DevicePlatform, NotificationType, Role } from '@prisma/client';

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
      deviceToken: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
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

  describe('device tokens and Expo push dispatch', () => {
    it('upserts device token and transfers ownership on shared device', async () => {
      const now = new Date();
      prismaMock.deviceToken.upsert.mockResolvedValue({
        id: 'dt-1',
        userId: 'user-2',
        token: 'ExponentPushToken[abc123]',
        platform: DevicePlatform.ANDROID,
        deviceId: 'pixel-7',
        isActive: true,
        lastUsedAt: now,
      });

      const res = await service.registerDeviceToken('user-2', {
        token: 'ExponentPushToken[abc123]',
        platform: DevicePlatform.ANDROID,
        deviceId: 'pixel-7',
      });

      expect(prismaMock.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: 'ExponentPushToken[abc123]' },
          update: expect.objectContaining({ userId: 'user-2', isActive: true }),
        }),
      );
      expect(res.isActive).toBe(true);
    });

    it('deactivates device token scoped to owning user', async () => {
      prismaMock.deviceToken.updateMany.mockResolvedValue({ count: 1 });
      const res = await service.deactivateDeviceToken('user-1', 'ExponentPushToken[abc123]');
      expect(res).toEqual({ success: true, deactivated: true });
      expect(prismaMock.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', token: 'ExponentPushToken[abc123]' },
        data: { isActive: false },
      });
    });

    it('dispatches non-blocking push on ORDER_STATUS without failing when Expo errors', async () => {
      const expoPushMock = {
        sendToUsers: vi.fn().mockRejectedValue(new Error('Expo gateway unreachable')),
      } as unknown as ExpoPushService;
      const serviceWithPush = new NotificationsService(prismaMock, expoPushMock);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: Role.CUSTOMER,
      });
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-2',
        userId: 'user-1',
        type: NotificationType.ORDER_STATUS,
        title: 'Order Shipped',
        message: 'Your order is on the way',
        linkUrl: '/orders/ord-1',
        isRead: false,
        createdAt: new Date(),
      });

      const res = await serviceWithPush.createNotification({
        userId: 'user-1',
        type: NotificationType.ORDER_STATUS,
        title: 'Order Shipped',
        message: 'Your order is on the way',
        linkUrl: '/orders/ord-1',
      });

      expect(res.id).toBe('notif-2');
      expect(expoPushMock.sendToUsers).toHaveBeenCalledWith(
        ['user-1'],
        expect.objectContaining({
          title: 'Order Shipped',
          route: '/orders/ord-1',
          type: NotificationType.ORDER_STATUS,
        }),
      );
    });

    it('deactivates stale tokens reported as DeviceNotRegistered by Expo', async () => {
      const expoClientMock = {
        chunkPushNotifications: vi.fn((msgs: any[]) => [msgs]),
        sendPushNotificationsAsync: vi.fn().mockResolvedValue([
          { status: 'ok', id: 'ticket-1' },
          { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } },
        ]),
      } as any;

      prismaMock.deviceToken.findMany.mockResolvedValue([
        { id: 'dt-1', token: 'ExponentPushToken[validToken001]' },
        { id: 'dt-2', token: 'ExponentPushToken[staleToken002]' },
      ]);
      prismaMock.deviceToken.updateMany.mockResolvedValue({ count: 1 });

      const pushService = new ExpoPushService(prismaMock, expoClientMock);
      await pushService.sendToUsers(['user-1'], {
        title: 'Payment Confirmed',
        body: 'Your payment succeeded',
        route: '/orders/ord-9',
        type: NotificationType.PAYMENT,
      });

      expect(expoClientMock.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(prismaMock.deviceToken.updateMany).toHaveBeenCalledWith({
        where: { token: { in: ['ExponentPushToken[staleToken002]'] } },
        data: { isActive: false },
      });
    });
  });
});
