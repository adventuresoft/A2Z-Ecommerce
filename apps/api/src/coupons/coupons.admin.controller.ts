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
  Req,
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
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CouponsService } from './coupons.service.js';
import {
  CouponQueryDto,
  CouponResponseDto,
  CouponStatsResponseDto,
  CreateCouponDto,
  PaginatedCouponResponseDto,
  UpdateCouponDto,
} from './dto/index.js';

@ApiTags('Admin Coupons & Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SHOP_MANAGER)
@Controller('admin/coupons')
export class CouponsAdminController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('stats')
  @RequirePermission('marketing', 'read')
  @ApiOperation({
    summary: 'Get aggregate promotional coupon statistics and total redemptions',
  })
  @ApiResponse({ status: 200, type: CouponStatsResponseDto })
  async getStats(): Promise<CouponStatsResponseDto> {
    return this.couponsService.getStats();
  }

  @Get()
  @RequirePermission('marketing', 'read')
  @ApiOperation({
    summary: 'List promotional coupons with pagination, search, and lifecycle status filters',
  })
  @ApiResponse({ status: 200, type: PaginatedCouponResponseDto })
  async findAll(
    @Query() query: CouponQueryDto,
  ): Promise<PaginatedCouponResponseDto> {
    return this.couponsService.findAllAdmin(query);
  }

  @Get(':id')
  @RequirePermission('marketing', 'read')
  @ApiOperation({
    summary: 'Get details of a specific coupon including recent redemption history',
  })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async findOne(@Param('id') id: string): Promise<CouponResponseDto> {
    return this.couponsService.findOneAdmin(id);
  }

  @Post()
  @RequirePermission('marketing', 'create')
  @ApiOperation({ summary: 'Create a new promotional coupon' })
  @ApiResponse({ status: 201, type: CouponResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid coupon parameters' })
  @ApiResponse({ status: 409, description: 'Coupon code already exists' })
  async create(
    @Body() dto: CreateCouponDto,
    @Req() req: Request & { user?: { id?: string; sub?: string } },
  ): Promise<CouponResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.couponsService.create(dto, userId);
  }

  @Patch(':id')
  @RequirePermission('marketing', 'update')
  @ApiOperation({ summary: 'Update a promotional coupon' })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @ApiResponse({ status: 200, type: CouponResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid coupon parameters' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  @ApiResponse({ status: 409, description: 'Coupon code already in use' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
    @Req() req: Request & { user?: { id?: string; sub?: string } },
  ): Promise<CouponResponseDto> {
    const userId = req.user?.id || req.user?.sub;
    return this.couponsService.update(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermission('marketing', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Delete an unused coupon or safely deactivate a coupon with historical redemptions',
  })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon deleted or safely deactivated',
  })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id?: string; sub?: string } },
  ): Promise<{ success: boolean; deactivated: boolean; message: string }> {
    const userId = req.user?.id || req.user?.sub;
    return this.couponsService.remove(id, userId);
  }
}
