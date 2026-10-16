import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class QueryMovementsDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
    description: 'Filter by specific product variant UUID',
  })
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({
    enum: StockMovementType,
    description: 'Filter by stock movement type',
    example: StockMovementType.RESTOCK,
  })
  @IsEnum(StockMovementType)
  @IsOptional()
  type?: StockMovementType;

  @ApiPropertyOptional({
    example: 'PO-2026-1001',
    description: 'Filter by reference code (order ID, PO number, etc.)',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00.000Z',
    description: 'Start date filter (inclusive)',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59.999Z',
    description: 'End date filter (inclusive)',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
