import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryInventoryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 't-shirt',
    description: 'Search term matching variant SKU, barcode, or parent product title',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
    description: 'Filter by parent category UUID',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter only variants where availableQuantity is less than or equal to lowStockThreshold',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter only variants where availableQuantity is zero',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  outOfStock?: boolean;

  @ApiPropertyOptional({
    example: 'updatedAt',
    default: 'updatedAt',
    enum: ['sku', 'quantity', 'availableQuantity', 'updatedAt'],
    description: 'Field to sort by',
  })
  @IsIn(['sku', 'quantity', 'availableQuantity', 'updatedAt'])
  @IsOptional()
  sortBy?: 'sku' | 'quantity' | 'availableQuantity' | 'updatedAt' = 'updatedAt';

  @ApiPropertyOptional({
    example: 'desc',
    default: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
