import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { AuditLogsService } from './audit-logs.service.js';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto.js';

@ApiTags('Admin System Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/audit-logs')
export class AuditLogsAdminController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission('settings', 'read')
  @ApiOperation({
    summary: 'Paginated list of system activity and audit logs',
  })
  async getAuditLogs(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.getAuditLogs(query);
  }

  @Get('filters')
  @RequirePermission('settings', 'read')
  @ApiOperation({
    summary: 'Get unique actions and entity types for filtering',
  })
  async getFilterOptions() {
    return this.auditLogsService.getFilterOptions();
  }

  @Get(':id')
  @RequirePermission('settings', 'read')
  @ApiOperation({
    summary: 'Get detail of single audit log entry',
  })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  async getAuditLogById(@Param('id') id: string) {
    return this.auditLogsService.getAuditLogById(id);
  }
}
