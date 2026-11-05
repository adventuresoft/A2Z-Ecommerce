import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service.js';
import { FreelancerStatus, NotificationType } from '@prisma/client';

describe('MessagingService', () => {
  let service: MessagingService;
  let prismaMock: any;
  let membershipsMock: any;
  let moderationMock: any;
  let gatewayMock: any;
  let notificationsMock: any;

  beforeEach(() => {
    prismaMock = {
      freelancerProfile: { findUnique: vi.fn() },
      conversation: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((arg) => (typeof arg === 'function' ? arg(prismaMock) : Promise.all(arg))),
    };

    membershipsMock = {
      checkUserAccess: vi.fn().mockResolvedValue(true),
    };

    moderationMock = {
      filterAndFlag: vi.fn().mockResolvedValue([]),
      isBlocked: vi.fn().mockResolvedValue(false),
      reportConversation: vi.fn(),
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
    };

    gatewayMock = {
      emitToUser: vi.fn(),
      isUserOnline: vi.fn().mockReturnValue(true),
    };

    notificationsMock = {
      createNotification: vi.fn().mockResolvedValue({}),
    };

    service = new MessagingService(
      prismaMock,
      membershipsMock,
      moderationMock,
      gatewayMock,
      notificationsMock,
    );
  });

  describe('getOrCreateConversation', () => {
    it('throws ForbiddenException if client has no active membership', async () => {
      membershipsMock.checkUserAccess.mockResolvedValue(false);
      await expect(
        service.getOrCreateConversation('client-1', { freelancerId: 'free-1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException if freelancer does not exist or is not APPROVED', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.getOrCreateConversation('client-1', { freelancerId: 'free-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects starting conversation with self', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'free-1',
        userId: 'client-1',
        status: FreelancerStatus.APPROVED,
      });
      await expect(
        service.getOrCreateConversation('client-1', { freelancerId: 'free-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects if communication is blocked', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'free-1',
        userId: 'user-free',
        status: FreelancerStatus.APPROVED,
      });
      moderationMock.isBlocked.mockResolvedValue(true);
      await expect(
        service.getOrCreateConversation('client-1', { freelancerId: 'free-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('enforces 20 new conversations per day limit', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'free-1',
        userId: 'user-free',
        status: FreelancerStatus.APPROVED,
      });
      prismaMock.conversation.findUnique.mockResolvedValue(null);
      prismaMock.conversation.count.mockResolvedValue(20);

      const err: any = await service
        .getOrCreateConversation('client-1', { freelancerId: 'free-1' })
        .catch((e) => e);

      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect(err.getResponse().code).toBe('CONVERSATION_QUOTA_EXCEEDED');
    });

    it('creates new conversation when valid', async () => {
      prismaMock.freelancerProfile.findUnique.mockResolvedValue({
        id: 'free-1',
        userId: 'user-free',
        status: FreelancerStatus.APPROVED,
      });
      prismaMock.conversation.findUnique.mockResolvedValue(null);
      prismaMock.conversation.count.mockResolvedValue(2);
      prismaMock.conversation.create.mockResolvedValue({
        id: 'conv-123',
        clientId: 'client-1',
        freelancerId: 'free-1',
      });

      const res = await service.getOrCreateConversation('client-1', { freelancerId: 'free-1' });
      expect(res.id).toBe('conv-123');
      expect(prismaMock.conversation.create).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    const mockConversation = {
      id: 'conv-1',
      clientId: 'client-1',
      freelancer: { userId: 'freelancer-user-1', displayName: 'Karim' },
      client: { id: 'client-1', name: 'Rahim' },
    };

    beforeEach(() => {
      prismaMock.conversation.findUnique.mockResolvedValue(mockConversation);
      prismaMock.message.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'client-1',
        body: 'Hello',
        flags: [],
      });
      prismaMock.conversation.update.mockResolvedValue(mockConversation);
    });

    it('allows active member to send message and emits over gateway', async () => {
      membershipsMock.checkUserAccess.mockResolvedValue(true);

      const msg = await service.sendMessage('client-1', 'conv-1', { body: 'Hello' });
      expect(msg.id).toBe('msg-1');
      expect(moderationMock.filterAndFlag).toHaveBeenCalledWith('client-1', 'Hello');
      expect(gatewayMock.emitToUser).toHaveBeenCalledWith('freelancer-user-1', 'message:new', expect.any(Object));
    });

    it('rejects client send if membership is expired', async () => {
      membershipsMock.checkUserAccess.mockResolvedValue(false);

      const err: any = await service.sendMessage('client-1', 'conv-1', { body: 'Hello' }).catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse().code).toBe('MEMBERSHIP_EXPIRED');
    });

    it('always allows freelancer reply even if client membership expired', async () => {
      membershipsMock.checkUserAccess.mockResolvedValue(false); // client expired

      const msg = await service.sendMessage('freelancer-user-1', 'conv-1', { body: 'I am available tomorrow' });
      expect(msg.id).toBe('msg-1');
      // Membership service checkUserAccess should NOT be called for freelancer
      expect(membershipsMock.checkUserAccess).not.toHaveBeenCalled();
      expect(gatewayMock.emitToUser).toHaveBeenCalledWith('client-1', 'message:new', expect.any(Object));
    });

    it('dispatches offline notification when recipient is not connected to gateway', async () => {
      gatewayMock.isUserOnline.mockReturnValue(false);

      await service.sendMessage('client-1', 'conv-1', { body: 'Inspection request' });
      expect(notificationsMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'freelancer-user-1',
          type: NotificationType.MESSAGE_NEW,
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('resets unread counter and marks messages as read', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        clientId: 'client-1',
        freelancer: { userId: 'free-user-1' },
      });

      const res = await service.markAsRead('client-1', 'conv-1');
      expect(res.success).toBe(true);
      expect(prismaMock.message.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 'conv-1', senderId: { not: 'client-1' }, readAt: null },
        }),
      );
      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { clientUnread: 0 },
        }),
      );
    });
  });
});
