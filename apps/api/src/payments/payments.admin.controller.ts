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
import { PaymentsService } from './payments.service.js';
import {
  CreatePaymentDto,
  PaginatedPaymentsResponseDto,
  PaymentResponseDto,
  PaymentStatsResponseDto,
  QueryPaymentsDto,
  UpdatePaymentStatusDto,
} from './dto/index.js';

@ApiTags('Admin Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('stats')
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'Retrieve financial overview, cash volume, and transaction metric counters',
  })
  @ApiResponse({ status: 200, type: PaymentStatsResponseDto })
  async getStats(): Promise<PaymentStatsResponseDto> {
    return this.paymentsService.getPaymentStats();
  }

  @Get('transactions')
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of monetary transactions with filters and search',
  })
  @ApiResponse({ status: 200, type: PaginatedPaymentsResponseDto })
  async getTransactions(
    @Query() query: QueryPaymentsDto,
  ): Promise<PaginatedPaymentsResponseDto> {
    return this.paymentsService.getPayments(query);
  }

  @Get('transactions/:id')
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'Retrieve detailed transaction breakdown by ID with order snapshot and refund ledger',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async getTransactionById(
    @Param('id') id: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentById(id);
  }

  @Post('transactions')
  @RequirePermission('payments', 'create')
  @ApiOperation({
    summary: 'Record a new payment transaction against an order (e.g. COD collection or gateway capture)',
  })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async createTransaction(
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPayment(dto);
  }

  @Patch('transactions/:id/status')
  @RequirePermission('payments', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update transaction state (e.g. mark COD as PAID or FAILED) and synchronize order status',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser() user?: AccessPayload,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.updatePaymentStatus(id, dto, user?.sub);
  }
}
