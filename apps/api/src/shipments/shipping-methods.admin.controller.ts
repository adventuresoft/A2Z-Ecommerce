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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ShipmentsService } from './shipments.service.js';
import {
  CreateShippingMethodDto,
  ShippingMethodResponseDto,
  UpdateShippingMethodDto,
} from './dto/index.js';

@ApiTags('Admin Shipping Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/shipping/methods')
export class ShippingMethodsAdminController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('shipping', 'create')
  @ApiOperation({ summary: 'Create a new shipping rate card method' })
  @ApiResponse({ status: 201, type: ShippingMethodResponseDto })
  async createMethod(
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    return this.shipmentsService.createMethod(dto);
  }

  @Get()
  @RequirePermission('shipping', 'read')
  @ApiOperation({ summary: 'List all shipping methods (with optional zone filter)' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filter by zone ID' })
  @ApiResponse({ status: 200, type: [ShippingMethodResponseDto] })
  async getMethods(
    @Query('zoneId') zoneId?: string,
  ): Promise<ShippingMethodResponseDto[]> {
    return this.shipmentsService.getAllMethods({ zoneId, includeInactive: true });
  }

  @Get(':id')
  @RequirePermission('shipping', 'read')
  @ApiOperation({ summary: 'Get a shipping method by ID' })
  @ApiParam({ name: 'id', description: 'Method UUID' })
  @ApiResponse({ status: 200, type: ShippingMethodResponseDto })
  async getMethodById(@Param('id') id: string): Promise<ShippingMethodResponseDto> {
    return this.shipmentsService.getMethodById(id);
  }

  @Patch(':id')
  @RequirePermission('shipping', 'update')
  @ApiOperation({ summary: 'Update shipping method details, fee, or status' })
  @ApiParam({ name: 'id', description: 'Method UUID' })
  @ApiResponse({ status: 200, type: ShippingMethodResponseDto })
  async updateMethod(
    @Param('id') id: string,
    @Body() dto: UpdateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    return this.shipmentsService.updateMethod(id, dto);
  }

  @Delete(':id')
  @RequirePermission('shipping', 'delete')
  @ApiOperation({ summary: 'Delete a shipping method' })
  @ApiParam({ name: 'id', description: 'Method UUID' })
  @ApiResponse({ status: 200 })
  async deleteMethod(@Param('id') id: string) {
    return this.shipmentsService.deleteMethod(id);
  }
}
