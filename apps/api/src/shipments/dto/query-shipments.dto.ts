import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryShipmentsDto {
  @ApiPropertyOptional({
    enum: ShipmentStatus,
    description: 'Filter shipments by status',
  })
  @IsEnum(ShipmentStatus)
  @IsOptional()
  status?: ShipmentStatus;

  @ApiPropertyOptional({
    example: 'Steadfast',
    description: 'Filter shipments by courier name',
  })
  @IsString()
  @IsOptional()
  courierName?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filter by specific order ID',
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({
    example: 'ST-2026',
    description: 'Search by tracking number, order number, courier name, or recipient name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['createdAt', 'status', 'courierName', 'shippedAt'],
    default: 'createdAt',
  })
  @IsIn(['createdAt', 'status', 'courierName', 'shippedAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
