import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, HttpException } from '@nestjs/common';
import { ModerationFilterService } from './moderation-filter.service.js';
import { MessageFlag } from '@prisma/client';

describe('ModerationFilterService', () => {
  let service: ModerationFilterService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      filterTerm: {
        findMany: vi.fn().mockResolvedValue([{ term: 'badword' }]),
      },
      message: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      userBlock: {
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      messageReport: {
        create: vi.fn().mockResolvedValue({ id: 'rep-1' }),
      },
    };

    service = new ModerationFilterService(prismaMock);
  });

  describe('filterAndFlag', () => {
    it('rejects empty or overly long messages', async () => {
      await expect(service.filterAndFlag('u1', '   ')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.filterAndFlag('u1', 'a'.repeat(2001))).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects messages containing prohibited words', async () => {
      await expect(service.filterAndFlag('u1', 'Hello this is a scam project')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.filterAndFlag('u1', 'Testing badword filter')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('flags Bangladeshi phone numbers', async () => {
      const flags1 = await service.filterAndFlag('u1', 'Call me at 01712345678 please');
      expect(flags1).toContain(MessageFlag.PHONE);

      const flags2 = await service.filterAndFlag('u1', 'My number is +8801812345678');
      expect(flags2).toContain(MessageFlag.PHONE);
    });

    it('flags web links and domains', async () => {
      const flags1 = await service.filterAndFlag('u1', 'Check my portfolio at https://example.com/work');
      expect(flags1).toContain(MessageFlag.LINK);

      const flags2 = await service.filterAndFlag('u1', 'Visit my site at mywork.io');
      expect(flags2).toContain(MessageFlag.LINK);
    });

    it('flags both phone and link when present', async () => {
      const flags = await service.filterAndFlag('u1', 'Call 01912345678 or visit example.com');
      expect(flags).toContain(MessageFlag.PHONE);
      expect(flags).toContain(MessageFlag.LINK);
    });

    it('returns empty flags for clean text', async () => {
      const flags = await service.filterAndFlag('u1', 'Can you come tomorrow around 10 AM to inspect the wiring?');
      expect(flags).toEqual([]);
    });

    it('enforces 1-hour cooldown after 3 flag offenses in 24 hours', async () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      prismaMock.message.findMany.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: thirtyMinsAgo },
      ]);

      const err: any = await service.filterAndFlag('u1', 'Here is my phone: 01711223344').catch((e) => e);
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(429);
      expect(err.getResponse().code).toBe('FLAG_COOLDOWN_ACTIVE');
    });
  });

  describe('isBlocked', () => {
    it('returns true if a block exists between userA and userB', async () => {
      prismaMock.userBlock.findFirst.mockResolvedValue({ blockerId: 'u1' });
      const blocked = await service.isBlocked('u1', 'u2');
      expect(blocked).toBe(true);
    });

    it('returns false if no block exists', async () => {
      prismaMock.userBlock.findFirst.mockResolvedValue(null);
      const blocked = await service.isBlocked('u1', 'u2');
      expect(blocked).toBe(false);
    });
  });

  describe('blockUser & reportConversation', () => {
    it('prevents user from blocking self', async () => {
      await expect(service.blockUser('u1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates report record with trimmed reason', async () => {
      await service.reportConversation('u1', 'c1', '  Abusive language in chat  ');
      expect(prismaMock.messageReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reporterId: 'u1',
            conversationId: 'c1',
            reason: 'Abusive language in chat',
          }),
        }),
      );
    });
  });
});

