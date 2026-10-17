import {
  Body,
  Controller,
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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ShipmentsService } from './shipments.service.js';
import {
  CreateShipmentDto,
  PaginatedShipmentsResponseDto,
  QueryShipmentsDto,
  ShipmentResponseDto,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/index.js';

@ApiTags('Admin Shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/shipments')
export class ShipmentsAdminController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('shipping', 'create')
  @ApiOperation({ summary: 'Create and prepare a courier shipment package for an order' })
  @ApiResponse({ status: 201, type: ShipmentResponseDto })
  async createShipment(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: AccessPayload,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.createShipment(dto, user?.sub);
  }

  @Get()
  @RequirePermission('shipping', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of shipments with search and filters',
  })
  @ApiResponse({ status: 200, type: PaginatedShipmentsResponseDto })
  async getShipments(
    @Query() query: QueryShipmentsDto,
  ): Promise<PaginatedShipmentsResponseDto> {
    return this.shipmentsService.getAdminShipments(query);
  }

  @Get(':id')
  @RequirePermission('shipping', 'read')
  @ApiOperation({
    summary: 'Retrieve detailed shipment view with order details and status timeline',
  })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  async getShipmentById(@Param('id') id: string): Promise<ShipmentResponseDto> {
    return this.shipmentsService.getShipmentById(id);
  }

  @Patch(':id/status')
  @RequirePermission('shipping', 'update')
  @ApiOperation({
    summary: 'Transition shipment transit status and synchronize with parent order fulfillment',
  })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: AccessPayload,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.updateShipmentStatus(id, dto, user?.sub);
  }

  @Patch(':id')
  @RequirePermission('shipping', 'update')
  @ApiOperation({ summary: 'Update shipment courier, tracking, and notes metadata' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  @ApiResponse({ status: 200, type: ShipmentResponseDto })
  async updateDetails(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.updateShipmentDetails(id, dto);
  }
}
