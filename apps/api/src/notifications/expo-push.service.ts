import { Injectable, Logger, Optional } from '@nestjs/common';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';

export interface PushDispatchPayload {
  title: string;
  body: string;
  route?: string | null;
  type: NotificationType;
}

const PUSH_ELIGIBLE_TYPES = new Set<NotificationType>([
  NotificationType.ORDER_STATUS,
  NotificationType.PAYMENT,
  NotificationType.PROMOTION,
]);

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() expoClient?: Expo,
  ) {
    this.expo = expoClient ?? new Expo();
  }

  isPushEligible(type: NotificationType): boolean {
    return PUSH_ELIGIBLE_TYPES.has(type);
  }

  async sendToUsers(userIds: string[], payload: PushDispatchPayload): Promise<void> {
    if (!userIds.length || !this.isPushEligible(payload.type)) {
      return;
    }

    try {
      const tokens = await this.prisma.deviceToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
        select: { id: true, token: true },
      });

      if (tokens.length === 0) {
        return;
      }

      const validEntries = tokens.filter((t) => Expo.isExpoPushToken(t.token));
      if (validEntries.length === 0) {
        return;
      }

      const channelId =
        payload.type === NotificationType.PROMOTION ? 'promotions' : 'orders';

      const messages: ExpoPushMessage[] = validEntries.map((entry) => ({
        to: entry.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        channelId,
        data: {
          type: payload.type,
          ...(payload.route ? { route: payload.route } : {}),
        },
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const staleTokens: string[] = [];

      for (const chunk of chunks) {
        try {
          const tickets: ExpoPushTicket[] =
            await this.expo.sendPushNotificationsAsync(chunk);

          tickets.forEach((ticket, idx) => {
            if (
              ticket.status === 'error' &&
              ticket.details?.error === 'DeviceNotRegistered'
            ) {
              const target = chunk[idx]?.to;
              if (typeof target === 'string') {
                staleTokens.push(target);
              }
            }
          });
        } catch (chunkErr: unknown) {
          const msg = chunkErr instanceof Error ? chunkErr.message : String(chunkErr);
          this.logger.warn(`Expo push chunk dispatch failed: ${msg}`);
        }
      }

      if (staleTokens.length > 0) {
        await this.prisma.deviceToken.updateMany({
          where: { token: { in: staleTokens } },
          data: { isActive: false },
        });
        this.logger.log(
          `Deactivated ${staleTokens.length} unregistered Expo push device token(s).`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Non-blocking push dispatch failed: ${msg}`);
    }
  }
}
