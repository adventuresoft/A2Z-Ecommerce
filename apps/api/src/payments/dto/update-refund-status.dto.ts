import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class UpdateRefundStatusDto {
  @ApiProperty({
    enum: RefundStatus,
    example: RefundStatus.COMPLETED,
    description: 'Updated refund resolution status (COMPLETED to finalize payout, REJECTED to deny request)',
  })
  @IsEnum(RefundStatus)
  @IsNotEmpty()
  status: RefundStatus;

  @ApiPropertyOptional({
    example: 'REFUND-SLIP-99021',
    description: 'Payout transaction reference or voucher receipt',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({
    example: 'Customer verified return parcel. Funds disbursed via bKash.',
    description: 'Administrative decision notes or reason for rejection',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
