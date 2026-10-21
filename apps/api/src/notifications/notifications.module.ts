import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsAdminController } from './notifications.admin.controller.js';
import { NotificationsUserController } from './notifications.user.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsAdminController, NotificationsUserController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
