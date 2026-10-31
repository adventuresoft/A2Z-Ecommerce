import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { PaymentsService } from './payments.service.js';
import {
  PaymentMethodResponseDto,
  TogglePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/index.js';

@ApiTags('Admin Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/payment-methods')
export class PaymentMethodsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission('payments', 'read')
  @ApiOperation({
    summary: 'List all payment methods with enabled/disabled status',
  })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async findAll(): Promise<PaymentMethodResponseDto[]> {
    return this.paymentsService.findAllPaymentMethods();
  }

  @Get(':id')
  @RequirePermission('payments', 'read')
  @ApiOperation({ summary: 'Retrieve single payment method configuration by ID' })
  @ApiParam({ name: 'id', description: 'Payment method UUID' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async findOne(@Param('id') id: string): Promise<PaymentMethodResponseDto> {
    return this.paymentsService.findPaymentMethodById(id);
  }

  @Patch(':id')
  @RequirePermission('payments', 'update')
  @ApiOperation({ summary: 'Update payment method details and instructions' })
  @ApiParam({ name: 'id', description: 'Payment method UUID' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentsService.updatePaymentMethod(id, dto);
  }

  @Patch(':id/toggle')
  @RequirePermission('payments', 'update')
  @ApiOperation({
    summary: 'Quick toggle payment method active/disabled status (On/Off switch)',
  })
  @ApiParam({ name: 'id', description: 'Payment method UUID' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async toggle(
    @Param('id') id: string,
    @Body() dto: TogglePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentsService.togglePaymentMethod(id, dto);
  }
}
