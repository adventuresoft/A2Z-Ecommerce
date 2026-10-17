import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { OrdersService } from './orders.service.js';
import {
  CancelOrderDto,
  CreateOrderDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  QueryOrdersDto,
} from './dto/index.js';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Place a new customer order with frozen item prices and stock reservation',
  })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve paginated order history for the authenticated customer',
  })
  @ApiResponse({ status: 200, type: PaginatedOrdersResponseDto })
  async getMyOrders(
    @CurrentUser() user: AccessPayload,
    @Query() query: QueryOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.ordersService.getCustomerOrders(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve detailed order information by ID for the owning customer',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrderById(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getCustomerOrderById(user.sub, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an eligible customer order in PENDING status and release stock',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async cancelOrder(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelCustomerOrder(user.sub, id, dto);
  }
}
