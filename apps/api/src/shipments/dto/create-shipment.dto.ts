import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the order to dispatch' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'Steadfast Courier', description: 'Name of the courier service' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  courierName: string;

  @ApiPropertyOptional({ example: 'ST-2026-987654', description: 'Courier tracking/consignment number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'https://steadfast.com.bd/t/ST-2026-987654', description: 'Public tracking URL' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  trackingUrl?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'Optional linked shipping method' })
  @IsUUID()
  @IsOptional()
  shippingMethodId?: string;

  @ApiPropertyOptional({ example: 'Fragile package, handle with care', description: 'Courier or internal notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
