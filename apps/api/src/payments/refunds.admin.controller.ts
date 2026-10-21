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
  CreateRefundDto,
  PaginatedRefundsResponseDto,
  RefundResponseDto,
  QueryRefundsDto,
  UpdateRefundStatusDto,
} from './dto/index.js';

@ApiTags('Admin Refunds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/refunds')
export class RefundsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of refunds with search and status filtering',
  })
  @ApiResponse({ status: 200, type: PaginatedRefundsResponseDto })
  async getRefunds(
    @Query() query: QueryRefundsDto,
  ): Promise<PaginatedRefundsResponseDto> {
    return this.paymentsService.getRefunds(query);
  }

  @Get(':id')
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'Retrieve single refund breakdown by ID with order snapshot and processor details',
  })
  @ApiParam({ name: 'id', description: 'Refund UUID' })
  @ApiResponse({ status: 200, type: RefundResponseDto })
  async getRefundById(@Param('id') id: string): Promise<RefundResponseDto> {
    return this.paymentsService.getRefundById(id);
  }

  @Post()
  @RequirePermission('payments', 'create')
  @ApiOperation({
    summary: 'Issue a new refund for an order with automated balance-check validation',
  })
  @ApiResponse({ status: 201, type: RefundResponseDto })
  async createRefund(
    @Body() dto: CreateRefundDto,
    @CurrentUser() user?: AccessPayload,
  ): Promise<RefundResponseDto> {
    return this.paymentsService.createRefund(dto, user?.sub);
  }

  @Patch(':id/status')
  @RequirePermission('payments', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update refund resolution state (e.g. approve or reject pending refund request)',
  })
  @ApiParam({ name: 'id', description: 'Refund UUID' })
  @ApiResponse({ status: 200, type: RefundResponseDto })
  async updateRefundStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundStatusDto,
    @CurrentUser() user?: AccessPayload,
  ): Promise<RefundResponseDto> {
    return this.paymentsService.updateRefundStatus(id, dto, user?.sub);
  }
}
