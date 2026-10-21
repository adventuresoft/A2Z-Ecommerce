import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum InventoryStockStatusFilter {
  ALL = 'ALL',
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class QueryInventoryReportDto {
  @ApiPropertyOptional({
    description: 'Start date for movement turnover timeline (inclusive, ISO)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for movement turnover timeline (inclusive, ISO)',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Stock status filter',
    enum: InventoryStockStatusFilter,
    default: InventoryStockStatusFilter.ALL,
  })
  @IsEnum(InventoryStockStatusFilter)
  @IsOptional()
  stockStatus?: InventoryStockStatusFilter = InventoryStockStatusFilter.ALL;

  @ApiPropertyOptional({
    description: 'Filter by Category UUID',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Brand UUID',
  })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Search keyword matching product title, SKU, or barcode',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum physical on-hand quantity',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum physical on-hand quantity',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxQuantity?: number;

  @ApiPropertyOptional({
    description: 'Timeline aggregation interval',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  interval?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: 'Page number for paginated lists',
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
    description: 'Sort field',
    default: 'updatedAt',
    enum: [
      'quantity',
      'availableQuantity',
      'reservedQuantity',
      'totalValuation',
      'productTitle',
      'sku',
      'regularPrice',
      'updatedAt',
    ],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
