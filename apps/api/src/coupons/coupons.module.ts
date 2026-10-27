import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { CouponsService } from './coupons.service.js';
import { CouponsAdminController } from './coupons.admin.controller.js';
import { CouponsController } from './coupons.controller.js';

@Module({
  imports: [PrismaModule, AuditLogsModule, AuthModule, JwtModule.register({})],
  controllers: [CouponsAdminController, CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
