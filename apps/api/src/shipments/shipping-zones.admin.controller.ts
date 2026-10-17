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
import { ShipmentsService } from './shipments.service.js';
import {
  CreateShippingZoneDto,
  ShippingZoneResponseDto,
  UpdateShippingZoneDto,
} from './dto/index.js';

@ApiTags('Admin Shipping Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/shipping/zones')
export class ShippingZonesAdminController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('shipping', 'create')
  @ApiOperation({ summary: 'Create a new shipping geographic zone' })
  @ApiResponse({ status: 201, type: ShippingZoneResponseDto })
  async createZone(
    @Body() dto: CreateShippingZoneDto,
  ): Promise<ShippingZoneResponseDto> {
    return this.shipmentsService.createZone(dto);
  }

  @Get()
  @RequirePermission('shipping', 'read')
  @ApiOperation({ summary: 'List all shipping zones (including inactive for admin)' })
  @ApiResponse({ status: 200, type: [ShippingZoneResponseDto] })
  async getZones(): Promise<ShippingZoneResponseDto[]> {
    return this.shipmentsService.getAllZones(true);
  }

  @Get(':id')
  @RequirePermission('shipping', 'read')
  @ApiOperation({ summary: 'Get a shipping zone by ID with its configured delivery methods' })
  @ApiParam({ name: 'id', description: 'Zone UUID' })
  @ApiResponse({ status: 200, type: ShippingZoneResponseDto })
  async getZoneById(@Param('id') id: string) {
    return this.shipmentsService.getZoneById(id);
  }

  @Patch(':id')
  @RequirePermission('shipping', 'update')
  @ApiOperation({ summary: 'Update shipping zone details or toggle status' })
  @ApiParam({ name: 'id', description: 'Zone UUID' })
  @ApiResponse({ status: 200, type: ShippingZoneResponseDto })
  async updateZone(
    @Param('id') id: string,
    @Body() dto: UpdateShippingZoneDto,
  ): Promise<ShippingZoneResponseDto> {
    return this.shipmentsService.updateZone(id, dto);
  }

  @Delete(':id')
  @RequirePermission('shipping', 'delete')
  @ApiOperation({ summary: 'Delete a shipping zone and its methods' })
  @ApiParam({ name: 'id', description: 'Zone UUID' })
  @ApiResponse({ status: 200 })
  async deleteZone(@Param('id') id: string) {
    return this.shipmentsService.deleteZone(id);
  }
}
