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
import { RolesService } from './roles.service.js';
import {
  CreateRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
} from './dto/index.js';

@ApiTags('Admin Security Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/roles')
export class RolesAdminController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'List all registered security roles with permission matrices' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  async getRoles(): Promise<RoleResponseDto[]> {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Get single security role definition with permissions' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('users', 'create')
  @ApiOperation({ summary: 'Create and publish a new security role with ability matrix' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Role name or slug already exists' })
  async createRole(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.createRole(dto);
  }

  @Patch(':id')
  @RequirePermission('users', 'update')
  @ApiOperation({ summary: 'Update security role name, description, or ability matrix' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  @ApiOperation({ summary: 'Delete custom security role (rejects system-reserved roles)' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system-reserved role or role with assigned users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.rolesService.deleteRole(id);
  }
}
