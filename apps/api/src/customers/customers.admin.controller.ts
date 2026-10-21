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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { CustomersService } from './customers.service.js';
import {
  CreateCustomerDto,
  CustomerDetailResponseDto,
  CustomerStatsResponseDto,
  PaginatedCustomersResponseDto,
  QueryCustomersDto,
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/index.js';

@ApiTags('Admin Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/customers')
export class CustomersAdminController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('stats')
  @RequirePermission('customers', 'read')
  @ApiOperation({
    summary: 'Retrieve customer count metrics, spending tiers, and revenue aggregates',
  })
  @ApiResponse({ status: 200, type: CustomerStatsResponseDto })
  async getStats(): Promise<CustomerStatsResponseDto> {
    return this.customersService.getStats();
  }

  @Get('export')
  @RequirePermission('customers', 'read')
  @ApiOperation({ summary: 'Export customer dataset to RFC 4180 CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCustomers(
    @Query() query: QueryCustomersDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.customersService.exportCsv(query);
    const filename = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(csvData);
  }

  @Get()
  @RequirePermission('customers', 'read')
  @ApiOperation({
    summary: 'Paginated customer accounts list with search, status, tier, and city filters',
  })
  @ApiResponse({ status: 200, type: PaginatedCustomersResponseDto })
  async getCustomers(
    @Query() query: QueryCustomersDto,
  ): Promise<PaginatedCustomersResponseDto> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('customers', 'read')
  @ApiOperation({
    summary: 'Retrieve comprehensive single customer 360 view with orders and reviews',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, type: CustomerDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerById(
    @Param('id') id: string,
  ): Promise<CustomerDetailResponseDto> {
    return this.customersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('customers', 'create')
  @ApiOperation({ summary: 'Register a new customer account via administration' })
  @ApiResponse({ status: 201, type: CustomerDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email address already registered' })
  async createCustomer(
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerDetailResponseDto> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('customers', 'update')
  @ApiOperation({ summary: 'Update customer details, credentials, or primary address' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, type: CustomerDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerDetailResponseDto> {
    return this.customersService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('customers', 'update')
  @ApiOperation({ summary: 'Toggle customer account active or suspended status' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer status updated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCustomerStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ): Promise<{ success: boolean; message: string; customer: CustomerDetailResponseDto }> {
    return this.customersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @RequirePermission('customers', 'delete')
  @ApiOperation({ summary: 'Delete or archive customer account with safety checks' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer deleted or archived' })
  @ApiResponse({ status: 400, description: 'Cannot delete customer with active orders' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async deleteCustomer(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.customersService.delete(id);
  }
}
