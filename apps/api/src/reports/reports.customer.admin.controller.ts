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
  CustomerCityMetricDto,
  CustomerReportListResponseDto,
  CustomerSegmentMetricDto,
  CustomerSummaryResponseDto,
  CustomerTimelineResponseDto,
  QueryCustomerReportDto,
  TopCustomerItemDto,
} from './dto/index.js';

@ApiTags('Admin Customer Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/reports/customers')
export class ReportsCustomerAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve high-level customer registration, retention, LTV, and activity KPIs',
  })
  @ApiResponse({ status: 200, type: CustomerSummaryResponseDto })
  async getSummary(
    @Query() query: QueryCustomerReportDto,
  ): Promise<CustomerSummaryResponseDto> {
    return this.reportsService.getCustomerSummary(query);
  }

  @Get('timeline')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve chronological customer acquisition and purchasing activity timeline',
  })
  @ApiResponse({ status: 200, type: CustomerTimelineResponseDto })
  async getTimeline(
    @Query() query: QueryCustomerReportDto,
  ): Promise<CustomerTimelineResponseDto> {
    return this.reportsService.getCustomerTimeline(query);
  }

  @Get('by-segment')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve customer count and revenue distribution grouped by spending and loyalty tiers',
  })
  @ApiResponse({ status: 200, type: [CustomerSegmentMetricDto] })
  async getBySegment(
    @Query() query: QueryCustomerReportDto,
  ): Promise<CustomerSegmentMetricDto[]> {
    return this.reportsService.getCustomerSegments(query);
  }

  @Get('by-city')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve geographic customer distribution grouped by shipping destination cities',
  })
  @ApiResponse({ status: 200, type: [CustomerCityMetricDto] })
  async getByCity(
    @Query() query: QueryCustomerReportDto,
  ): Promise<CustomerCityMetricDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getCustomerByCity(query, limit);
  }

  @Get('top-customers')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve top spending VIP customers with highest cumulative purchases',
  })
  @ApiResponse({ status: 200, type: [TopCustomerItemDto] })
  async getTopCustomers(
    @Query() query: QueryCustomerReportDto,
  ): Promise<TopCustomerItemDto[]> {
    const limit = query.limit ? Number(query.limit) : 10;
    return this.reportsService.getTopCustomers(query, limit);
  }

  @Get('list')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Retrieve paginated list of customers matching filters with order metrics and insights',
  })
  @ApiResponse({ status: 200, type: CustomerReportListResponseDto })
  async getCustomerList(
    @Query() query: QueryCustomerReportDto,
  ): Promise<CustomerReportListResponseDto> {
    return this.reportsService.getCustomerList(query);
  }

  @Get('export')
  @RequirePermission('reports', 'read')
  @ApiOperation({
    summary: 'Export filtered customer report records in CSV format',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="customer-report.csv"')
  async exportCsv(
    @Query() query: QueryCustomerReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.reportsService.exportCustomerCsv(query);
    res.attachment(
      `customer-report-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.type('text/csv');
    res.send(csvData);
  }
}
