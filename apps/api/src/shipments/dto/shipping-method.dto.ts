import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShippingMethodDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Associated zone ID' })
  @IsUUID()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({ example: 'Standard Delivery', description: 'Method name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 60.0, description: 'Delivery fee' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost: number;

  @ApiPropertyOptional({ example: 2, default: 3, description: 'Estimated delivery duration in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedDays?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateShippingMethodDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiPropertyOptional({ example: 'Express Next-Day Delivery' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 120.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class ShippingMethodResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  zoneId: string;

  @ApiPropertyOptional({ example: 'Inside Dhaka' })
  zoneName?: string;

  @ApiProperty({ example: 'Standard Delivery' })
  name: string;

  @ApiProperty({ example: 60.0 })
  cost: number;

  @ApiProperty({ example: 2 })
  estimatedDays: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  updatedAt: Date;
}
