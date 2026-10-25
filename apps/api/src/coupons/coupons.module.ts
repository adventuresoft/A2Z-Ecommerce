import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { CouponsService } from './coupons.service.js';
import { CouponsAdminController } from './coupons.admin.controller.js';
import { CouponsController } from './coupons.controller.js';

@Module({
  imports: [PrismaModule, AuditLogsModule, JwtModule.register({})],
  controllers: [CouponsAdminController, CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
