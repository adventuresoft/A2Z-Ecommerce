import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MembershipsModule } from '../memberships/memberships.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { ModerationFilterService } from './moderation-filter.service.js';
import { MessagingGateway } from './messaging.gateway.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembershipsModule,
    NotificationsModule,
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    ModerationFilterService,
    MessagingGateway,
  ],
  exports: [
    MessagingService,
    ModerationFilterService,
    MessagingGateway,
  ],
})
export class MessagingModule {}

