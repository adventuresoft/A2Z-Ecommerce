import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShippingZoneDto {
  @ApiProperty({ example: 'Inside Dhaka', description: 'Name of the shipping geographic zone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'All districts within Dhaka metropolitan area' })
  @IsString()
  @IsOptional()
  description?: string;

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

export class UpdateShippingZoneDto {
  @ApiPropertyOptional({ example: 'Inside Dhaka City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated zone description' })
  @IsString()
  @IsOptional()
  description?: string;

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

export class ShippingZoneResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Inside Dhaka' })
  name: string;

  @ApiPropertyOptional({ example: 'All districts within Dhaka metropolitan area' })
  description?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ example: 2 })
  methodsCount?: number;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  updatedAt: Date;
}
