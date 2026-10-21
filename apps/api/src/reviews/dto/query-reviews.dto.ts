import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class QueryReviewsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
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
    description: 'Search in comment, title, product title, user name or email',
    example: 'quality',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Review Moderation Status',
    enum: ReviewStatus,
  })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Filter by Rating stars (1 to 5)',
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter by target Product ID',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by verified purchase flag',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVerifiedPurchase?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by creation start date (ISO string)',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation end date (ISO string)',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'rating'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'rating' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
