import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import {
  BroadcastNotificationDto,
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationStatsResponseDto,
  PaginatedNotificationsResponseDto,
  QueryNotificationsDto,
} from './dto/index.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispatch a direct notification to a specific user.
   */
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`Recipient User with ID '${dto.userId}' not found`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        linkUrl: dto.linkUrl ?? null,
        isRead: false,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return this.mapNotification(notification);
  }

  /**
   * Broadcast a notification to all active users or a specific role audience.
   */
  async broadcastNotification(
    dto: BroadcastNotificationDto,
  ): Promise<{ success: boolean; dispatchedCount: number }> {
    const userWhere: Prisma.UserWhereInput = { isActive: true };
    if (dto.targetRole) {
      userWhere.role = dto.targetRole;
    }

    const targetUsers = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return { success: true, dispatchedCount: 0 };
    }

    const records = targetUsers.map((u) => ({
      userId: u.id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      linkUrl: dto.linkUrl ?? null,
      isRead: false,
    }));

    const result = await this.prisma.notification.createMany({
      data: records,
    });

    return {
      success: true,
      dispatchedCount: result.count,
    };
  }

  /**
   * Administrative query with search, category filters, and pagination.
   */
  async getAdminNotifications(
    query: QueryNotificationsDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 15));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { message: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapNotification(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * System-wide notification counts and distribution metrics.
   */
  async getNotificationStats(): Promise<NotificationStatsResponseDto> {
    const [
      totalCount,
      unreadCount,
      readCount,
      orderStatusCount,
      paymentCount,
      lowStockCount,
      promotionCount,
      systemCount,
    ] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.notification.count({ where: { isRead: true } }),
      this.prisma.notification.count({ where: { type: NotificationType.ORDER_STATUS } }),
      this.prisma.notification.count({ where: { type: NotificationType.PAYMENT } }),
      this.prisma.notification.count({ where: { type: NotificationType.LOW_STOCK } }),
      this.prisma.notification.count({ where: { type: NotificationType.PROMOTION } }),
      this.prisma.notification.count({ where: { type: NotificationType.SYSTEM } }),
    ]);

    return {
      totalCount,
      unreadCount,
      readCount,
      byType: {
        orderStatus: orderStatusCount,
        payment: paymentCount,
        lowStock: lowStockCount,
        promotion: promotionCount,
        system: systemCount,
      },
    };
  }

  /**
   * Get notifications for authenticated user (e.g. for navbar dropdown or customer center).
   */
  async getUserNotifications(
    userId: string,
    unreadOnly = false,
    page = 1,
    limit = 20,
  ): Promise<PaginatedNotificationsResponseDto> {
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapNotification(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notification counter for top navbar badge.
   */
  async getUserUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string, userId?: string): Promise<NotificationResponseDto> {
    const where: Prisma.NotificationWhereUniqueInput = { id };
    const notification = await this.prisma.notification.findUnique({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    if (userId && notification.userId !== userId) {
      throw new BadRequestException('You can only mark your own notifications as read');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return this.mapNotification(updated);
  }

  /**
   * Mark all notifications as read for a given user.
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, count: result.count };
  }

  /**
   * Permanently delete a notification.
   */
  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    await this.prisma.notification.delete({ where: { id } });
    return { success: true, message: 'Notification deleted successfully' };
  }

  private mapNotification(notif: any): NotificationResponseDto {
    return {
      id: notif.id,
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      linkUrl: notif.linkUrl,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      user: notif.user
        ? {
            id: notif.user.id,
            name: notif.user.name,
            email: notif.user.email,
            role: notif.user.role,
          }
        : undefined,
    };
  }
}
