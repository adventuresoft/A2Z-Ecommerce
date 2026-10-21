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
import { NotificationType } from '@prisma/client';

export class QueryNotificationsDto {
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
    description: 'Search in title, message, recipient name or email',
    example: 'stock',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Notification category type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by read status',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specific recipient User ID',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

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
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
