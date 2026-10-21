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
  CategorySalesBreakdownDto,
  OrderStatusBreakdownDto,
  PaginatedSalesOrdersResponseDto,
  PaymentMethodBreakdownDto,
  QuerySalesReportDto,
  SalesSummaryResponseDto,
  SalesTimelineResponseDto,
  TopSellingProductDto,
} from './dto/index.js';

@ApiTags('Admin Sales Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/reports/sales')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve high-level sales KPI summary metrics for given period',
  })
  @ApiResponse({ status: 200, type: SalesSummaryResponseDto })
  async getSummary(
    @Query() query: QuerySalesReportDto,
  ): Promise<SalesSummaryResponseDto> {
    return this.reportsService.getSalesSummary(query);
  }

  @Get('timeline')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve chronological sales trend timeline grouped by day, week, or month',
  })
  @ApiResponse({ status: 200, type: SalesTimelineResponseDto })
  async getTimeline(
    @Query() query: QuerySalesReportDto,
  ): Promise<SalesTimelineResponseDto> {
    return this.reportsService.getSalesTimeline(query);
  }

  @Get('by-payment-method')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve sales distribution breakdown across payment methods',
  })
  @ApiResponse({ status: 200, type: [PaymentMethodBreakdownDto] })
  async getByPaymentMethod(
    @Query() query: QuerySalesReportDto,
  ): Promise<PaymentMethodBreakdownDto[]> {
    return this.reportsService.getSalesByPaymentMethod(query);
  }

  @Get('by-order-status')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve order and revenue volume breakdown by order status',
  })
  @ApiResponse({ status: 200, type: [OrderStatusBreakdownDto] })
  async getByOrderStatus(
    @Query() query: QuerySalesReportDto,
  ): Promise<OrderStatusBreakdownDto[]> {
    return this.reportsService.getSalesByOrderStatus(query);
  }

  @Get('top-products')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve best-selling products ranked by units sold and revenue',
  })
  @ApiResponse({ status: 200, type: [TopSellingProductDto] })
  async getTopProducts(
    @Query() query: QuerySalesReportDto,
  ): Promise<TopSellingProductDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getTopSellingProducts(query, limit);
  }

  @Get('by-category')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve sales and quantity contribution aggregated by category',
  })
  @ApiResponse({ status: 200, type: [CategorySalesBreakdownDto] })
  async getByCategory(
    @Query() query: QuerySalesReportDto,
  ): Promise<CategorySalesBreakdownDto[]> {
    return this.reportsService.getSalesByCategory(query);
  }

  @Get('orders')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve paginated list of sales order transactions with audit details',
  })
  @ApiResponse({ status: 200, type: PaginatedSalesOrdersResponseDto })
  async getSalesOrders(
    @Query() query: QuerySalesReportDto,
  ): Promise<PaginatedSalesOrdersResponseDto> {
    return this.reportsService.getSalesOrders(query);
  }

  @Get('export')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Export filtered sales report orders in CSV format',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="sales-report.csv"')
  async exportCsv(
    @Query() query: QuerySalesReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.reportsService.exportSalesCsv(query);
    res.attachment(`sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
    res.type('text/csv');
    res.send(csvData);
  }
}
