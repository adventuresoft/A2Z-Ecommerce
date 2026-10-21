import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReportsService } from './reports.service.js';
import { ReportsAdminController } from './reports.admin.controller.js';
import { ReportsOrdersAdminController } from './reports.orders.admin.controller.js';
import { ReportsInventoryAdminController } from './reports.inventory.admin.controller.js';
import { ReportsCustomerAdminController } from './reports.customer.admin.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ReportsAdminController,
    ReportsOrdersAdminController,
    ReportsInventoryAdminController,
    ReportsCustomerAdminController,
  ],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
