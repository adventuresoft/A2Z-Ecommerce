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
import { OrdersService } from './orders.service.js';
import {
  CreateAdminOrderDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
} from './dto/index.js';

@ApiTags('Admin Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermission('orders', 'create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Administrative manual order creation with custom customer, shipping and item options',
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async createOrder(
    @Body() dto: CreateAdminOrderDto,
    @CurrentUser() user: AccessPayload,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createAdminOrder(user.sub, dto);
  }

  @Get()
  @RequirePermission('orders', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of all customer orders with filters and search',
  })
  @ApiResponse({ status: 200, type: PaginatedOrdersResponseDto })
  async getOrders(
    @Query() query: QueryOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.ordersService.getAdminOrders(query);
  }

  @Get(':id')
  @RequirePermission('orders', 'read')
  @ApiOperation({
    summary: 'Retrieve detailed administrative order view with status history and frozen snapshots',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.getAdminOrderById(id);
  }

  @Patch(':id/status')
  @RequirePermission('orders', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition order status, payment status, or shipment status with audit note',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user?: AccessPayload,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(id, dto, user?.sub);
  }
}
