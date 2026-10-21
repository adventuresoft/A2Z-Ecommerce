import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    enum: PaymentStatus,
    description: 'Updated payment transaction status',
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @ApiPropertyOptional({
    example: 'COD-CONFIRMED-8841',
    description: 'Transaction confirmation reference / money receipt number',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({
    example: 'Collected via delivery rider at doorstep',
    description: 'Audit note regarding status update or failure reason',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-10-21T12:00:00.000Z',
    description: 'Timestamp when payment was marked as paid',
  })
  @IsOptional()
  paidAt?: string;
}
