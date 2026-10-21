import {
  Controller,
  Get,
  Header,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ReportsService } from './reports.service.js';
import {
  CriticalAlertItemDto,
  InventoryBrandMetricDto,
  InventoryCategoryMetricDto,
  InventoryReportListResponseDto,
  InventoryStockStatusMetricDto,
  InventorySummaryResponseDto,
  InventoryTimelineResponseDto,
  QueryInventoryReportDto,
  StockMovementTypeMetricDto,
  TopMoverItemDto,
} from './dto/index.js';

@ApiTags('Admin Inventory Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/reports/inventory')
export class ReportsInventoryAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve high-level inventory valuation, unit balances, and stock health KPIs',
  })
  @ApiResponse({ status: 200, type: InventorySummaryResponseDto })
  async getSummary(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventorySummaryResponseDto> {
    return this.reportsService.getInventorySummary(query);
  }

  @Get('timeline')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve chronological stock movement inflow vs outflow turnover timeline',
  })
  @ApiResponse({ status: 200, type: InventoryTimelineResponseDto })
  async getTimeline(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventoryTimelineResponseDto> {
    return this.reportsService.getInventoryTimeline(query);
  }

  @Get('by-status')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve inventory distribution grouped by stock condition (In Stock, Low Stock, Out of Stock)',
  })
  @ApiResponse({ status: 200, type: [InventoryStockStatusMetricDto] })
  async getByStatus(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventoryStockStatusMetricDto[]> {
    return this.reportsService.getInventoryByStatus(query);
  }

  @Get('by-category')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve inventory unit balance and valuation breakdown by category',
  })
  @ApiResponse({ status: 200, type: [InventoryCategoryMetricDto] })
  async getByCategory(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventoryCategoryMetricDto[]> {
    return this.reportsService.getInventoryByCategory(query);
  }

  @Get('by-brand')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve inventory unit balance and valuation breakdown by brand',
  })
  @ApiResponse({ status: 200, type: [InventoryBrandMetricDto] })
  async getByBrand(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventoryBrandMetricDto[]> {
    return this.reportsService.getInventoryByBrand(query);
  }

  @Get('movements-by-type')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve stock movement transaction counts and unit changes classified by movement reason',
  })
  @ApiResponse({ status: 200, type: [StockMovementTypeMetricDto] })
  async getMovementsByType(
    @Query() query: QueryInventoryReportDto,
  ): Promise<StockMovementTypeMetricDto[]> {
    return this.reportsService.getInventoryMovementsByType(query);
  }

  @Get('top-movers')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve top fast-moving SKUs with highest deductions/orders during period',
  })
  @ApiResponse({ status: 200, type: [TopMoverItemDto] })
  async getTopMovers(
    @Query() query: QueryInventoryReportDto,
  ): Promise<TopMoverItemDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getInventoryTopMovers(query, limit);
  }

  @Get('critical-alerts')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve critical depleted or low-stock SKUs requiring immediate warehouse restock',
  })
  @ApiResponse({ status: 200, type: [CriticalAlertItemDto] })
  async getCriticalAlerts(
    @Query() query: QueryInventoryReportDto,
  ): Promise<CriticalAlertItemDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getInventoryCriticalAlerts(query, limit);
  }

  @Get('list')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve paginated list of inventory valuation and status records matching filters',
  })
  @ApiResponse({ status: 200, type: InventoryReportListResponseDto })
  async getInventoryList(
    @Query() query: QueryInventoryReportDto,
  ): Promise<InventoryReportListResponseDto> {
    return this.reportsService.getInventoryList(query);
  }

  @Get('export')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Export filtered inventory valuation and status report in CSV format',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="inventory-report.csv"')
  async exportCsv(
    @Query() query: QueryInventoryReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.reportsService.exportInventoryCsv(query);
    res.attachment(
      `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.type('text/csv');
    res.send(csvData);
  }
}
