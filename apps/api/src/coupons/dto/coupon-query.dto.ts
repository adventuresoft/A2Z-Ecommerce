import { ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CouponQueryDto {
  @ApiPropertyOptional({ description: 'Search by coupon code or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: DiscountType,
    description: 'Filter by discount calculation type',
  })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Filter by boolean active flag' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: ['LIVE', 'SCHEDULED', 'EXPIRED', 'EXHAUSTED', 'INACTIVE'],
    description: 'Filter by computed lifecycle status',
  })
  @IsIn(['LIVE', 'SCHEDULED', 'EXPIRED', 'EXHAUSTED', 'INACTIVE'])
  @IsOptional()
  status?: 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE';

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
