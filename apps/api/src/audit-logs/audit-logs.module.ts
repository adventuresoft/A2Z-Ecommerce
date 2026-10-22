import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogsAdminController } from './audit-logs.admin.controller.js';

@Global()
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AuditLogsAdminController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
