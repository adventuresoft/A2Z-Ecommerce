import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { TaxesModule } from '../taxes/taxes.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersAdminController } from './orders.admin.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule, AuditLogsModule, TaxesModule, CouponsModule],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
