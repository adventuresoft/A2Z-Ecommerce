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
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import {
  BatchUpdateSettingsDto,
  CreateSettingDto,
  QuerySettingsDto,
  SettingResponseDto,
  UpdateSettingDto,
} from './dto/index.js';
import { SettingsService } from './settings.service.js';

@ApiTags('Admin Store Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('admin/settings')
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermission('settings', 'read')
  @ApiOperation({ summary: 'List all store settings with optional group or public filtering' })
  @ApiResponse({
    status: 200,
    description: 'Array of store settings',
    type: [SettingResponseDto],
  })
  async findAll(@Query() query: QuerySettingsDto) {
    return this.settingsService.findAll(query);
  }

  @Get('groups')
  @RequirePermission('settings', 'read')
  @ApiOperation({ summary: 'List distinct setting groups' })
  @ApiResponse({
    status: 200,
    description: 'Array of group names',
    type: [String],
  })
  async getGroups() {
    return this.settingsService.getGroups();
  }

  @Get(':key')
  @RequirePermission('settings', 'read')
  @ApiOperation({ summary: 'Get a specific store setting by its key' })
  @ApiParam({ name: 'key', example: 'store_name' })
  @ApiResponse({
    status: 200,
    description: 'Store setting details',
    type: SettingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('settings', 'create')
  @ApiOperation({ summary: 'Create a new store setting (SuperAdmin only)' })
  @ApiResponse({
    status: 201,
    description: 'Setting created successfully',
    type: SettingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Setting key collision' })
  async create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @Patch('batch')
  @RequirePermission('settings', 'update')
  @ApiOperation({ summary: 'Batch update multiple store settings atomically' })
  @ApiResponse({
    status: 200,
    description: 'Array of updated store settings',
    type: [SettingResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async batchUpdate(@Body() dto: BatchUpdateSettingsDto) {
    return this.settingsService.batchUpdate(dto);
  }

  @Patch(':key')
  @RequirePermission('settings', 'update')
  @ApiOperation({ summary: 'Update a specific store setting by key' })
  @ApiParam({ name: 'key', example: 'store_name' })
  @ApiResponse({
    status: 200,
    description: 'Updated store setting',
    type: SettingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.settingsService.update(key, dto);
  }

  @Delete(':key')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('settings', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a store setting (SuperAdmin only)' })
  @ApiParam({ name: 'key', example: 'custom_feature_flag' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }
}
