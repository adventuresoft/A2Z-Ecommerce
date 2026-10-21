import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the order to bill',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
    description: 'Payment method used',
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;

  @ApiProperty({
    example: 1250.0,
    description: 'Monetary amount billed/collected',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'BDT',
    default: 'BDT',
    description: 'ISO currency code',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string = 'BDT';

  @ApiPropertyOptional({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    description: 'Initial transaction state',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus = PaymentStatus.PENDING;

  @ApiPropertyOptional({
    example: 'COD-REC-98213',
    description: 'Gateway reference or COD physical receipt number',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({
    example: 'idemp_key_123456789',
    description: 'Unique client idempotency token to prevent double charging',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    example: 'Customer confirmed cash payment on doorstep delivery',
    description: 'Administrative or gateway payment notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-10-21T10:00:00.000Z',
    description: 'Date and time payment was confirmed/collected',
  })
  @IsOptional()
  paidAt?: string;
}
