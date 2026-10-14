import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CategoryQueryDto {
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

  @ApiPropertyOptional({ example: 'laptop', description: 'Search term matching name or slug' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
    description: 'Filter by parent category ID. Pass "null" or "root" to fetch root categories only',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'sortOrder',
    default: 'sortOrder',
    enum: ['name', 'sortOrder', 'createdAt'],
    description: 'Column to sort by',
  })
  @IsIn(['name', 'sortOrder', 'createdAt'])
  @IsOptional()
  sortBy?: 'name' | 'sortOrder' | 'createdAt' = 'sortOrder';

  @ApiPropertyOptional({
    example: 'asc',
    default: 'asc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
