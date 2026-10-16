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
import {
  AdjustStockDto,
  InventoryItemDto,
  LowStockSummaryDto,
  PaginatedInventoryResponseDto,
  PaginatedMovementsResponseDto,
  QueryInventoryDto,
  QueryMovementsDto,
  UpdateThresholdDto,
} from './dto/index.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('Admin Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/inventory')
export class InventoryAdminController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermission('inventory', 'read')
  @ApiOperation({
    summary: 'Paginated overview of all variant warehouse inventory balances',
  })
  @ApiResponse({ status: 200, type: PaginatedInventoryResponseDto })
  async getOverview(
    @Query() query: QueryInventoryDto,
  ): Promise<PaginatedInventoryResponseDto> {
    return this.inventoryService.getInventoryOverview(query);
  }

  @Get('low-stock')
  @RequirePermission('inventory', 'read')
  @ApiOperation({
    summary: 'Retrieve summary and list of items at or below low-stock threshold',
  })
  @ApiResponse({ status: 200, type: LowStockSummaryDto })
  async getLowStock(
    @Query('limit') limit?: number,
  ): Promise<LowStockSummaryDto> {
    return this.inventoryService.getLowStockAlerts(limit ? Number(limit) : 20);
  }

  @Get('movements')
  @RequirePermission('inventory', 'read')
  @ApiOperation({
    summary: 'Paginated query of the immutable stock movement audit ledger',
  })
  @ApiResponse({ status: 200, type: PaginatedMovementsResponseDto })
  async getMovements(
    @Query() query: QueryMovementsDto,
  ): Promise<PaginatedMovementsResponseDto> {
    return this.inventoryService.getStockMovements(query);
  }

  @Get(':variantId')
  @RequirePermission('inventory', 'read')
  @ApiOperation({ summary: 'Get inventory status for a specific variant' })
  @ApiParam({ name: 'variantId', description: 'ProductVariant UUID' })
  @ApiResponse({ status: 200, type: InventoryItemDto })
  async getVariant(
    @Param('variantId') variantId: string,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.getVariantInventory(variantId);
  }

  @Post('adjust')
  @RequirePermission('inventory', 'update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust physical stock with concurrency row lock and movement logging',
  })
  @ApiResponse({ status: 200, type: InventoryItemDto })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user?: AccessPayload,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.adjustStock(dto, user?.sub);
  }

  @Patch(':variantId/threshold')
  @RequirePermission('inventory', 'update')
  @ApiOperation({ summary: 'Update low-stock alert threshold for a variant' })
  @ApiParam({ name: 'variantId', description: 'ProductVariant UUID' })
  @ApiResponse({ status: 200, type: InventoryItemDto })
  async updateThreshold(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateThresholdDto,
  ): Promise<InventoryItemDto> {
    return this.inventoryService.updateThreshold(
      variantId,
      dto.lowStockThreshold,
    );
  }
}
