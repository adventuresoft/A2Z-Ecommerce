import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateShipmentStatusDto {
  @ApiProperty({
    enum: ShipmentStatus,
    example: ShipmentStatus.DISPATCHED,
    description: 'Target shipment transit status',
  })
  @IsEnum(ShipmentStatus)
  @IsNotEmpty()
  status: ShipmentStatus;

  @ApiPropertyOptional({
    example: 'Package dispatched via Steadfast hub Banani',
    description: 'Audit note describing status transition',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'ST-2026-987654',
    description: 'Update or set tracking number on transit event',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({
    example: 'https://steadfast.com.bd/t/ST-2026-987654',
    description: 'Update or set tracking URL on transit event',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  trackingUrl?: string;
}

export class UpdateShipmentDto {
  @ApiPropertyOptional({ example: 'Pathao Courier' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  courierName?: string;

  @ApiPropertyOptional({ example: 'PATHAO-456789' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'https://pathao.com/tracking/PATHAO-456789' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  trackingUrl?: string;

  @ApiPropertyOptional({ example: 'Updated packaging instructions' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsString()
  @IsOptional()
  shippingMethodId?: string;
}
