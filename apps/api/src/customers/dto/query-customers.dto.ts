import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum CustomerSpendingTierFilter {
  ALL = 'ALL',
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  ONE_TIME = 'ONE_TIME',
  ZERO_ORDER = 'ZERO_ORDER',
}

export class QueryCustomersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 15, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 15;

  @ApiPropertyOptional({ description: 'Search term matching name, email, phone, or location' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by account status (true/false/all)' })
  @IsOptional()
  isActive?: boolean | string;

  @ApiPropertyOptional({
    enum: CustomerSpendingTierFilter,
    description: 'Filter by customer spending tier: ALL, VIP, REGULAR, ONE_TIME, ZERO_ORDER',
  })
  @IsOptional()
  @IsEnum(CustomerSpendingTierFilter)
  spendingTier?: CustomerSpendingTierFilter;

  @ApiPropertyOptional({ description: 'Filter by destination city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'totalSpent', 'ordersCount', 'lastOrderDate'],
    default: 'createdAt',
    description: 'Field to sort customers by',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' | 'totalSpent' | 'ordersCount' | 'lastOrderDate' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
