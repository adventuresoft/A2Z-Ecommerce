import { Global, Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogsAdminController } from './audit-logs.admin.controller.js';

@Global()
@Module({
  controllers: [AuditLogsAdminController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
