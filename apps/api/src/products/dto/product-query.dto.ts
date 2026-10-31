import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term matching title or slug' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by brand UUID' })
  @IsUUID('4')
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag UUID' })
  @IsUUID('4')
  @IsOptional()
  tagId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag slug' })
  @IsString()
  @IsOptional()
  tagSlug?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by featured flag' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['title', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsIn(['title', 'createdAt', 'updatedAt'])
  @IsOptional()
  sortBy?: 'title' | 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
