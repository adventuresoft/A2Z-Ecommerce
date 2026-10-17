import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { PermissionsService } from './permissions.service.js';
import {
  CreatePermissionDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from './dto/index.js';

@ApiTags('Admin Global Permissions Registry')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/permissions')
export class PermissionsAdminController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'List all global permissions from registry' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  async getPermissions(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.getAllPermissions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('users', 'create')
  @ApiOperation({ summary: 'Register a new permission descriptor' })
  @ApiResponse({ status: 201, type: PermissionResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Permission key already exists' })
  async createPermission(
    @Body() dto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.createPermission(dto);
  }

  @Patch(':id')
  @RequirePermission('users', 'update')
  @ApiOperation({ summary: 'Update permission display name or description' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.updatePermission(id, dto);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  @ApiOperation({ summary: 'Delete custom permission entry' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system-reserved permission' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async deletePermission(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.permissionsService.deletePermission(id);
  }
}
