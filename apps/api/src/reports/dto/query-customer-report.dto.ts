import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum CustomerSpendingTier {
  ALL = 'ALL',
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  ONE_TIME = 'ONE_TIME',
  ZERO_ORDER = 'ZERO_ORDER',
}

export enum CustomerStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class QueryCustomerReportDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format (inclusive)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (inclusive)',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by account status (ALL, ACTIVE, INACTIVE)',
    enum: CustomerStatusFilter,
    default: CustomerStatusFilter.ALL,
  })
  @IsEnum(CustomerStatusFilter)
  @IsOptional()
  customerStatus?: CustomerStatusFilter = CustomerStatusFilter.ALL;

  @ApiPropertyOptional({
    description: 'Filter by customer spending tier (ALL, VIP, REGULAR, ONE_TIME, ZERO_ORDER)',
    enum: CustomerSpendingTier,
    default: CustomerSpendingTier.ALL,
  })
  @IsEnum(CustomerSpendingTier)
  @IsOptional()
  spendingTier?: CustomerSpendingTier = CustomerSpendingTier.ALL;

  @ApiPropertyOptional({
    description: 'Filter by shipping destination city',
    example: 'Dhaka',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Search by customer name, email, or telephone number',
    example: 'Rahim',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Timeline aggregation interval',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  interval?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: 'Page number for paginated customer lists',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    default: 15,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 15;

  @ApiPropertyOptional({
    description: 'Sort field: createdAt, totalSpent, ordersCount, name',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction: asc or desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
