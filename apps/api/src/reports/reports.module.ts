import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { ReportsService } from './reports.service.js';
import { ReportsAdminController } from './reports.admin.controller.js';
import { ReportsOrdersAdminController } from './reports.orders.admin.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportsAdminController, ReportsOrdersAdminController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
