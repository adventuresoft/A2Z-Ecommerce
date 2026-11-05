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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, SubscriptionStatus, MembershipPaymentStatus } from '@prisma/client';
import { MembershipsService } from './memberships.service.js';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from './dto/membership.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Admin Memberships')
@Controller('admin/memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class MembershipsAdminController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Admin list all membership plans' })
  async getAllPlans() {
    return this.membershipsService.getAllPlansAdmin();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create new membership plan' })
  async createPlan(@Body() dto: CreateMembershipPlanDto) {
    return this.membershipsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update membership plan' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Soft delete / deactivate membership plan' })
  async deletePlan(@Param('id') id: string) {
    return this.membershipsService.deletePlan(id);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List customer subscriptions' })
  async listSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.membershipsService.listSubscriptions({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('payments')
  @ApiOperation({ summary: 'List customer membership payments' })
  async listPayments(
    @Query('status') status?: MembershipPaymentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.membershipsService.listPayments({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('payments/:id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund membership payment and cancel subscription' })
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser() adminUser: AccessPayload,
  ) {
    return this.membershipsService.refundPayment(id, adminUser.sub);
  }
}

