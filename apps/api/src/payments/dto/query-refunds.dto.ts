import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class QueryRefundsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
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
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by order number, refund reference, or customer name/email',
    example: 'AZ-2026',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Refund resolution status',
    enum: RefundStatus,
  })
  @IsEnum(RefundStatus)
  @IsOptional()
  status?: RefundStatus;

  @ApiPropertyOptional({
    description: 'Filter by associated Order UUID',
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by associated Payment UUID',
  })
  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Filter refunds processed on or after this ISO date',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter refunds processed on or before this ISO date',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'amount'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'amount' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
