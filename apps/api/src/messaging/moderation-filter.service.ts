import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { MessageFlag } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// Default abusive terms in Bangla and English for baseline protection
const BASELINE_BAD_WORDS = [
  'scam',
  'fraud',
  'cheat',
  'hack',
  'harass',
  'bastard',
  'chotlok',
  'harami',
  'shala',
  'magi',
  'khankir',
  'bessha',
];

// Bangladeshi mobile phone numbers: 013-019 followed by 8 digits (support spaces/dashes)
const BD_PHONE_REGEX = /(?:\+?88\s*0\s*1|0\s*1)[3-9](?:[\s-]*\d){8}/i;

// URL / Web domain pattern
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.(?:com|net|org|xyz|io|app|live|me|info)(?:\/[^\s]*)?/i;

@Injectable()
export class ModerationFilterService {
  private cachedTerms: string[] = [];
  private lastTermsFetch = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute

  constructor(private readonly prisma: PrismaService) {}

  private async getProhibitedWords(): Promise<string[]> {
    const now = Date.now();
    if (now - this.lastTermsFetch < this.CACHE_TTL_MS && this.cachedTerms.length > 0) {
      return this.cachedTerms;
    }

    try {
      const dbTerms = await this.prisma.filterTerm.findMany({
        where: { isActive: true },
        select: { term: true },
      });
      const termsSet = new Set([
        ...BASELINE_BAD_WORDS.map((w) => w.toLowerCase()),
        ...dbTerms.map((t) => t.term.toLowerCase().trim()),
      ]);
      this.cachedTerms = Array.from(termsSet);
      this.lastTermsFetch = now;
      return this.cachedTerms;
    } catch {
      return BASELINE_BAD_WORDS;
    }
  }

  /**
   * Scans text for bad words, phone numbers, and URLs.
   * Throws BadRequestException if prohibited words are found.
   * Throws 429 if the user has triggered 3+ flags within 24h and is inside a 1-hour penalty cooldown.
   */
  async filterAndFlag(userId: string, text: string): Promise<MessageFlag[]> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Message body cannot be empty');
    }
    if (trimmed.length > 2000) {
      throw new BadRequestException('Message exceeds maximum length of 2000 characters');
    }

    // 1. Check prohibited words
    const lower = trimmed.toLowerCase();
    const badWords = await this.getProhibitedWords();
    for (const word of badWords) {
      // Word boundary or substring check for Bengali/Latin
      if (lower.includes(word)) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Message contains prohibited or abusive content.',
          code: 'PROHIBITED_CONTENT',
        });
      }
    }

    // 2. Extract flags (PHONE, LINK)
    const flags: MessageFlag[] = [];
    if (BD_PHONE_REGEX.test(trimmed)) {
      flags.push(MessageFlag.PHONE);
    }
    if (URL_REGEX.test(trimmed)) {
      flags.push(MessageFlag.LINK);
    }

    // 3. Check 24-hour flagged messages rate limit (3 flags in 24h triggers 1-hour timeout)
    if (flags.length > 0) {
      await this.enforceFlagRateLimit(userId);
    }

    return flags;
  }

  /**
   * Enforces 1-hour rate limit if sender has triggered 3+ flagged messages in the past 24 hours.
   */
  async enforceFlagRateLimit(userId: string): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const flaggedMessages = await this.prisma.message.findMany({
      where: {
        senderId: userId,
        createdAt: { gte: oneDayAgo },
        flags: { isEmpty: false },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { createdAt: true },
    });

    if (flaggedMessages.length >= 3) {
      const thirdRecent = flaggedMessages[2];
      const cooldownEnd = new Date(thirdRecent.createdAt.getTime() + 60 * 60 * 1000);
      const now = new Date();

      if (now < cooldownEnd) {
        const remainingMinutes = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (60 * 1000));
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Account temporarily restricted from sending messages for ${remainingMinutes} more minute(s) due to repeated contact policy warnings.`,
            code: 'FLAG_COOLDOWN_ACTIVE',
            cooldownEnd: cooldownEnd.toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  /**
   * Checks if communication is blocked between two users in either direction.
   */
  async isBlocked(userA: string, userB: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
      select: { blockerId: true },
    });
    return !!block;
  }

  /**
   * Blocks a user.
   */
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }
    return this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  /**
   * Unblocks a user.
   */
  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  /**
   * Reports a conversation.
   */
  async reportConversation(
    reporterId: string,
    conversationId: string,
    reason: string,
    messageId?: string,
  ) {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Report reason is required');
    }

    return this.prisma.messageReport.create({
      data: {
        reporterId,
        conversationId,
        messageId: messageId || null,
        reason: trimmedReason,
        status: 'PENDING',
      },
    });
  }
}

