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
  MinLength,
} from 'class-validator';
import { PaymentMethod, RefundStatus } from '@prisma/client';

export class CreateRefundDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the order to refund',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Specific payment transaction to refund against (optional if order has a paid transaction)',
  })
  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @ApiProperty({
    example: 350.0,
    description: 'Monetary refund amount in BDT',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'Damaged item returned during delivery inspection',
    description: 'Detailed explanation and business reason for the refund',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({
    enum: RefundStatus,
    default: RefundStatus.COMPLETED,
    description: 'Refund status (COMPLETED for immediate disbursement, PENDING for approval workflow)',
  })
  @IsEnum(RefundStatus)
  @IsOptional()
  status?: RefundStatus = RefundStatus.COMPLETED;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Method through which the refund is paid out (e.g. CASH_ON_DELIVERY cash payout, MOBILE_BANKING, etc.)',
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  refundMethod?: PaymentMethod;

  @ApiPropertyOptional({
    example: 'REFUND-SLIP-99021',
    description: 'Payout reference code or transaction receipt',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({
    example: 'Approved by store manager after customer returned unboxed parcel',
    description: 'Administrative processing notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
