import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationStatus,
  FreelancerStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { MembershipsService } from '../memberships/memberships.service.js';
import { ModerationFilterService } from './moderation-filter.service.js';
import { MessagingGateway } from './messaging.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  CreateConversationDto,
  QueryMessagesDto,
  SendMessageDto,
} from './dto/messaging.dto.js';

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const MAX_DAILY_NEW_CONVERSATIONS = 20;

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
    private readonly moderationFilter: ModerationFilterService,
    private readonly gateway: MessagingGateway,
    private readonly notifications: NotificationsService,
  ) {}

  private dhakaDayStart(now: Date = new Date()): Date {
    const shifted = new Date(now.getTime() + DHAKA_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
  }

  /**
   * Start or retrieve a conversation thread between a client and a freelancer.
   * Gated by active membership check on the client.
   */
  async getOrCreateConversation(clientId: string, dto: CreateConversationDto) {
    const hasMembership = await this.membershipsService.checkUserAccess(clientId);
    if (!hasMembership) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: 'Active membership plan required to start conversations.',
        code: 'MEMBERSHIP_REQUIRED',
      });
    }

    const freelancer = await this.prisma.freelancerProfile.findUnique({
      where: { id: dto.freelancerId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    if (!freelancer || freelancer.status !== FreelancerStatus.APPROVED) {
      throw new NotFoundException('Freelancer not found or not currently available');
    }

    if (freelancer.userId === clientId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const isBlocked = await this.moderationFilter.isBlocked(clientId, freelancer.userId);
    if (isBlocked) {
      throw new BadRequestException('Cannot message this professional due to safety settings');
    }

    // Check for existing conversation
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        clientId_freelancerId: { clientId, freelancerId: dto.freelancerId },
      },
      include: {
        freelancer: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            profession: { select: { id: true, name: true } },
            userId: true,
          },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });

    if (!conversation) {
      // Check 20 conversations/day limit for the client
      const dayStart = this.dhakaDayStart();
      const countToday = await this.prisma.conversation.count({
        where: {
          clientId,
          createdAt: { gte: dayStart },
        },
      });

      if (countToday >= MAX_DAILY_NEW_CONVERSATIONS) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Daily limit of ${MAX_DAILY_NEW_CONVERSATIONS} new conversations reached. Try again tomorrow.`,
            code: 'CONVERSATION_QUOTA_EXCEEDED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      conversation = await this.prisma.conversation.create({
        data: {
          clientId,
          freelancerId: dto.freelancerId,
          status: ConversationStatus.OPEN,
        },
        include: {
          freelancer: {
            select: {
              id: true,
              displayName: true,
              photoUrl: true,
              profession: { select: { id: true, name: true } },
              userId: true,
            },
          },
          client: {
            select: { id: true, name: true },
          },
        },
      });
    }

    if (dto.initialMessage?.trim()) {
      await this.sendMessage(clientId, conversation.id, { body: dto.initialMessage });
    }

    return conversation;
  }

  /**
   * List all conversation threads for a user (as client or as freelancer).
   */
  async listUserConversations(userId: string) {
    // Find freelancer profile id if the user is an approved freelancer
    const freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    const where: Prisma.ConversationWhereInput = {
      OR: [
        { clientId: userId },
        ...(freelancerProfile ? [{ freelancerId: freelancerProfile.id }] : []),
      ],
    };

    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        client: {
          select: { id: true, name: true },
        },
        freelancer: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            userId: true,
            profession: { select: { id: true, name: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            body: true,
            flags: true,
            senderId: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
    });

    return conversations.map((conv) => {
      const isClient = conv.clientId === userId;
      const unreadCount = isClient ? conv.clientUnread : conv.freelancerUnread;
      const otherParticipant = isClient
        ? {
            id: conv.freelancer.userId,
            name: conv.freelancer.displayName,
            photoUrl: conv.freelancer.photoUrl,
            role: 'FREELANCER',
            title: conv.freelancer.profession?.name || null,
          }
        : {
            id: conv.client.id,
            name: conv.client.name,
            photoUrl: null,
            role: 'CLIENT',
            title: null,
          };

      return {
        id: conv.id,
        isClient,
        unreadCount,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt || conv.createdAt,
        otherParticipant,
      };
    });
  }

  /**
   * Retrieve message stream for a specific conversation with reverse cursor pagination.
   */
  async getMessages(userId: string, conversationId: string, query: QueryMessagesDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        freelancer: { select: { userId: true, displayName: true } },
        client: { select: { id: true, name: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isClient = conversation.clientId === userId;
    const isFreelancer = conversation.freelancer.userId === userId;
    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const limit = query.limit || 30;
    const where: Prisma.MessageWhereInput = {
      conversationId,
    };

    if (query.beforeId) {
      const cursorMessage = await this.prisma.message.findUnique({
        where: { id: query.beforeId },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;

    // Return in chronological order
    const items = pageMessages.reverse();

    return {
      conversation: {
        id: conversation.id,
        clientId: conversation.clientId,
        freelancerUserId: conversation.freelancer.userId,
        freelancerDisplayName: conversation.freelancer.displayName,
        clientName: conversation.client.name,
        isClient,
      },
      items,
      hasMore,
    };
  }

  /**
   * Send a message in a conversation.
   * Client send is gated by active membership.
   * Freelancer reply is always allowed.
   */
  async sendMessage(senderId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        freelancer: { select: { userId: true, displayName: true } },
        client: { select: { id: true, name: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isClient = conversation.clientId === senderId;
    const isFreelancer = conversation.freelancer.userId === senderId;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Membership Policy: Client must have active membership. Freelancer can always reply.
    if (isClient) {
      const hasMembership = await this.membershipsService.checkUserAccess(senderId);
      if (!hasMembership) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'Your membership has expired. Please renew your membership plan to send messages.',
          code: 'MEMBERSHIP_EXPIRED',
        });
      }
    }

    // Safety: check user blocks
    const otherUserId = isClient ? conversation.freelancer.userId : conversation.clientId;
    const blocked = await this.moderationFilter.isBlocked(senderId, otherUserId);
    if (blocked) {
      throw new BadRequestException('Cannot send message due to safety block');
    }

    // Moderate text (bad words rejection, flag detection, 24h rate limit)
    const flags = await this.moderationFilter.filterAndFlag(senderId, dto.body);

    const now = new Date();

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          body: dto.body.trim(),
          flags,
          createdAt: now,
        },
        include: {
          sender: { select: { id: true, name: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: now,
          clientUnread: isClient ? undefined : { increment: 1 },
          freelancerUnread: isFreelancer ? undefined : { increment: 1 },
        },
      }),
    ]);

    // WebSocket Real-time Push
    this.gateway.emitToUser(otherUserId, 'message:new', {
      conversationId,
      message,
    });

    // Check if recipient is online; if not, queue notification
    const recipientOnline = this.gateway.isUserOnline(otherUserId);
    if (!recipientOnline) {
      const senderName = isClient ? conversation.client.name : conversation.freelancer.displayName;
      try {
        await this.notifications.createNotification({
          userId: otherUserId,
          type: NotificationType.MESSAGE_NEW,
          title: `New message from ${senderName}`,
          message: dto.body.length > 80 ? `${dto.body.slice(0, 77)}...` : dto.body,
          linkUrl: `/messages/${conversationId}`,
        });
      } catch (err) {
        // Non-blocking notification dispatch failure
        console.error('[MessagingService] Failed to dispatch offline notification:', err);
      }
    }

    return message;
  }

  /**
   * Mark messages in a conversation as read by the current user.
   */
  async markAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        freelancer: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isClient = conversation.clientId === userId;
    const isFreelancer = conversation.freelancer.userId === userId;
    if (!isClient && !isFreelancer) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: now },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: isClient ? { clientUnread: 0 } : { freelancerUnread: 0 },
      }),
    ]);

    return { success: true };
  }
}

