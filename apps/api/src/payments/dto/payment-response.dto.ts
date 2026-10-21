import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

export class OrderSnapshotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'AZ-2026-X8K2M9' })
  orderNumber: string;

  @ApiProperty({ example: 1250.0 })
  grandTotal: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 'John Doe' })
  recipientName: string;

  @ApiProperty({ example: '+8801712345678' })
  recipientPhone: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  customerName?: string;
}

export class PaymentRefundSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174099' })
  id: string;

  @ApiProperty({ example: 500.0 })
  amount: number;

  @ApiProperty({ example: 'COMPLETED' })
  status: string;

  @ApiProperty({ example: 'Customer returned damaged item' })
  reason: string;

  @ApiProperty({ example: '2026-10-21T14:30:00.000Z' })
  createdAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH_ON_DELIVERY })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  status: PaymentStatus;

  @ApiProperty({ example: 1250.0 })
  amount: number;

  @ApiProperty({ example: 'BDT' })
  currency: string;

  @ApiPropertyOptional({ example: 'COD-CONFIRMED-8841' })
  transactionRef?: string | null;

  @ApiPropertyOptional({ example: 'idemp_key_123456789' })
  idempotencyKey?: string | null;

  @ApiPropertyOptional({ example: 'Payment received in full' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '2026-10-21T12:00:00.000Z' })
  paidAt?: Date | null;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => OrderSnapshotDto })
  order?: OrderSnapshotDto;

  @ApiPropertyOptional({ type: () => [PaymentRefundSummaryDto] })
  refunds?: PaymentRefundSummaryDto[];

  @ApiPropertyOptional({ example: 0.0 })
  refundedAmount?: number;
}

export class PaginatedPaymentsResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  data: PaymentResponseDto[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 10, totalPages: 10 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
