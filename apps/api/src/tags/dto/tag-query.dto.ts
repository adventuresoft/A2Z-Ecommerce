import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TagQueryDto {
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
    example: 'summer',
    description: 'Search term matching tag name or slug (case-insensitive)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status (true or false)',
  })
  @Type(() => Object)
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'name',
    default: 'name',
    enum: ['name', 'createdAt', 'productCount'],
    description: 'Column to sort by',
  })
  @IsIn(['name', 'createdAt', 'productCount'], {
    message: 'sortBy must be one of: name, createdAt, productCount',
  })
  @IsOptional()
  sortBy?: 'name' | 'createdAt' | 'productCount' = 'name';

  @ApiPropertyOptional({
    example: 'asc',
    default: 'asc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be one of: asc, desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
