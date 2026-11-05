import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessagingController } from './messaging.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('MessagingController', () => {
  let controller: MessagingController;
  let serviceMock: any;
  let moderationMock: any;

  beforeEach(() => {
    serviceMock = {
      getOrCreateConversation: vi.fn().mockResolvedValue({ id: 'c1' }),
      listUserConversations: vi.fn().mockResolvedValue([]),
      getMessages: vi.fn().mockResolvedValue({ items: [] }),
      sendMessage: vi.fn().mockResolvedValue({ id: 'm1' }),
      markAsRead: vi.fn().mockResolvedValue({ success: true }),
    };

    moderationMock = {
      reportConversation: vi.fn().mockResolvedValue({ id: 'rep1' }),
      blockUser: vi.fn().mockResolvedValue({}),
      unblockUser: vi.fn().mockResolvedValue({}),
    };

    controller = new MessagingController(serviceMock, moderationMock);
  });

  it('is protected by JwtAuthGuard at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', MessagingController);
    expect(guards).toContain(JwtAuthGuard);
  });

  it('delegates createConversation with user id', async () => {
    const res = await controller.createConversation(
      { sub: 'u1', role: 'CUSTOMER' } as any,
      { freelancerId: 'f1' },
    );
    expect(res).toEqual({ id: 'c1' });
    expect(serviceMock.getOrCreateConversation).toHaveBeenCalledWith('u1', { freelancerId: 'f1' });
  });

  it('delegates sendMessage with sender sub and conversationId', async () => {
    const res = await controller.sendMessage(
      { sub: 'u1', role: 'CUSTOMER' } as any,
      'c1',
      { body: 'Hello' },
    );
    expect(res).toEqual({ id: 'm1' });
    expect(serviceMock.sendMessage).toHaveBeenCalledWith('u1', 'c1', { body: 'Hello' });
  });

  it('delegates report and block actions', async () => {
    await controller.reportConversation({ sub: 'u1' } as any, 'c1', { reason: 'Abuse' });
    expect(moderationMock.reportConversation).toHaveBeenCalledWith('u1', 'c1', 'Abuse', undefined);

    await controller.blockUser({ sub: 'u1' } as any, 'u2');
    expect(moderationMock.blockUser).toHaveBeenCalledWith('u1', 'u2');
  });
});

