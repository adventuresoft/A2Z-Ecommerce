import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryAdminController } from './inventory.admin.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InventoryAdminController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
