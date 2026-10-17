import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SettingsAdminController } from './settings.admin.controller.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SettingsAdminController, SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
