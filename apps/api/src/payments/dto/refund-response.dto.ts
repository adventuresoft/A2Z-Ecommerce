import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, RefundStatus } from '@prisma/client';
import { OrderSnapshotDto } from './payment-response.dto.js';

export class PaymentSummaryInRefundDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH_ON_DELIVERY })
  method: PaymentMethod;

  @ApiProperty({ example: 1250.0 })
  amount: number;

  @ApiProperty({ example: 'PAID' })
  status: string;

  @ApiPropertyOptional({ example: 'COD-CONFIRMED-8841' })
  transactionRef?: string | null;
}

export class RefundResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174099' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  orderId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  paymentId: string;

  @ApiProperty({ example: 350.0 })
  amount: number;

  @ApiProperty({ example: 'Damaged item returned during delivery inspection' })
  reason: string;

  @ApiProperty({ enum: RefundStatus, example: RefundStatus.COMPLETED })
  status: RefundStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.CASH_ON_DELIVERY })
  refundMethod?: PaymentMethod | null;

  @ApiPropertyOptional({ example: 'REFUND-SLIP-99021' })
  transactionRef?: string | null;

  @ApiPropertyOptional({ example: 'Approved by admin' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174088' })
  processedByUserId?: string | null;

  @ApiPropertyOptional({ example: 'Store Admin' })
  processedByUserName?: string | null;

  @ApiProperty({ example: '2026-10-21T14:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T14:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => OrderSnapshotDto })
  order?: OrderSnapshotDto;

  @ApiPropertyOptional({ type: () => PaymentSummaryInRefundDto })
  payment?: PaymentSummaryInRefundDto;
}

export class PaginatedRefundsResponseDto {
  @ApiProperty({ type: [RefundResponseDto] })
  data: RefundResponseDto[];

  @ApiProperty({
    example: { total: 20, page: 1, limit: 10, totalPages: 2 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
