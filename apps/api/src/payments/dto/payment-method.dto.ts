import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Cash on Delivery', description: 'Customer-facing title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Pay cash upon receiving parcel at your doorstep.',
    description: 'Summary shown at checkout step',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Please send a check to AZ Store, 123 Commercial Ave, Dhaka 1212.',
    description: 'Detailed post-order payment instructions',
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: true, description: 'Enable or disable this payment method' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Display priority sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: '104-1653730183', description: 'Merchant ID for payment gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  merchantId?: string;

  @ApiPropertyOptional({ example: 'gamecoderstorepass', description: 'Password or API Secret Key for gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  password?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the gateway runs in sandbox/test mode' })
  @IsOptional()
  @IsBoolean()
  isSandbox?: boolean;
}

export class TogglePaymentMethodDto {
  @ApiPropertyOptional({ example: true, description: 'Explicit enabled state (toggles current state if omitted)' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  code: string;

  @ApiProperty({ example: 'Cash on Delivery' })
  name: string;

  @ApiPropertyOptional({ example: 'Pay with cash upon delivery' })
  description: string | null;

  @ApiPropertyOptional({ example: 'Please keep exact cash ready for courier delivery agent.' })
  instructions: string | null;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiPropertyOptional({ example: '104-1653730183' })
  merchantId?: string | null;

  @ApiPropertyOptional({ example: 'gamecoderstorepass' })
  password?: string | null;

  @ApiPropertyOptional({ example: true })
  isSandbox?: boolean | null;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  updatedAt: Date;
}

export class ActivePaymentMethodDto {
  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  code: string;

  @ApiProperty({ example: 'Cash on Delivery' })
  name: string;

  @ApiPropertyOptional({ example: 'Pay with cash upon delivery' })
  description: string | null;

  @ApiPropertyOptional({ example: 'Please keep exact cash ready for courier delivery agent.' })
  instructions: string | null;

  @ApiProperty({ example: 1 })
  sortOrder: number;
}
