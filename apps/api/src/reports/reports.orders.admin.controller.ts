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
  OrderStatusMetricDto,
  OrdersReportListResponseDto,
  OrdersSummaryResponseDto,
  OrdersTimelineResponseDto,
  PaymentStatusMetricDto,
  QueryOrdersReportDto,
  ShipmentStatusMetricDto,
  ShippingCityMetricDto,
  ShippingMethodMetricDto,
} from './dto/index.js';

@ApiTags('Admin Orders Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/reports/orders')
export class ReportsOrdersAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve high-level order KPI summary metrics and fulfillment rates for given period',
  })
  @ApiResponse({ status: 200, type: OrdersSummaryResponseDto })
  async getSummary(
    @Query() query: QueryOrdersReportDto,
  ): Promise<OrdersSummaryResponseDto> {
    return this.reportsService.getOrdersSummary(query);
  }

  @Get('timeline')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve chronological orders trend timeline grouped by day, week, or month',
  })
  @ApiResponse({ status: 200, type: OrdersTimelineResponseDto })
  async getTimeline(
    @Query() query: QueryOrdersReportDto,
  ): Promise<OrdersTimelineResponseDto> {
    return this.reportsService.getOrdersTimeline(query);
  }

  @Get('by-status')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve order count and volume breakdown by order lifecycle status',
  })
  @ApiResponse({ status: 200, type: [OrderStatusMetricDto] })
  async getByStatus(
    @Query() query: QueryOrdersReportDto,
  ): Promise<OrderStatusMetricDto[]> {
    return this.reportsService.getOrdersByStatus(query);
  }

  @Get('by-shipment-status')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve order count and volume breakdown by shipment fulfillment status',
  })
  @ApiResponse({ status: 200, type: [ShipmentStatusMetricDto] })
  async getByShipmentStatus(
    @Query() query: QueryOrdersReportDto,
  ): Promise<ShipmentStatusMetricDto[]> {
    return this.reportsService.getOrdersByShipmentStatus(query);
  }

  @Get('by-payment-status')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve order count and volume breakdown by payment status',
  })
  @ApiResponse({ status: 200, type: [PaymentStatusMetricDto] })
  async getByPaymentStatus(
    @Query() query: QueryOrdersReportDto,
  ): Promise<PaymentStatusMetricDto[]> {
    return this.reportsService.getOrdersByPaymentStatus(query);
  }

  @Get('by-shipping-city')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve geographic distribution of orders across shipping destination cities',
  })
  @ApiResponse({ status: 200, type: [ShippingCityMetricDto] })
  async getByShippingCity(
    @Query() query: QueryOrdersReportDto,
  ): Promise<ShippingCityMetricDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getOrdersByShippingCity(query, limit);
  }

  @Get('by-shipping-method')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve order breakdown aggregated across shipping methods and zones',
  })
  @ApiResponse({ status: 200, type: [ShippingMethodMetricDto] })
  async getByShippingMethod(
    @Query() query: QueryOrdersReportDto,
  ): Promise<ShippingMethodMetricDto[]> {
    return this.reportsService.getOrdersByShippingMethod(query);
  }

  @Get('list')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve paginated list of orders matching report filters with audit details',
  })
  @ApiResponse({ status: 200, type: OrdersReportListResponseDto })
  async getOrdersList(
    @Query() query: QueryOrdersReportDto,
  ): Promise<OrdersReportListResponseDto> {
    return this.reportsService.getOrdersList(query);
  }

  @Get('export')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Export filtered orders report in CSV format',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="orders-report.csv"')
  async exportCsv(
    @Query() query: QueryOrdersReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.reportsService.exportOrdersCsv(query);
    res.attachment(
      `orders-report-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.type('text/csv');
    res.send(csvData);
  }
}
