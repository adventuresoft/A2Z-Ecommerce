import { ApiProperty } from '@nestjs/swagger';

export class PaymentStatsResponseDto {
  @ApiProperty({ example: 450000.0, description: 'Total gross value across all payments' })
  totalVolume: number;

  @ApiProperty({ example: 380000.0, description: 'Total monetary sum confirmed as paid' })
  totalCollected: number;

  @ApiProperty({ example: 70000.0, description: 'Total monetary sum in pending status (e.g. pending COD)' })
  totalPendingCod: number;

  @ApiProperty({ example: 12500.0, description: 'Total monetary sum refunded to customers' })
  totalRefunded: number;

  @ApiProperty({ example: 350, description: 'Total count of transactions' })
  transactionCount: number;

  @ApiProperty({ example: 300, description: 'Count of transactions in PAID status' })
  paidCount: number;

  @ApiProperty({ example: 45, description: 'Count of transactions in PENDING status' })
  pendingCount: number;

  @ApiProperty({ example: 5, description: 'Count of transactions in FAILED status' })
  failedCount: number;

  @ApiProperty({ example: 12, description: 'Total count of refunds issued' })
  refundCount: number;

  @ApiProperty({ example: 2, description: 'Count of refunds pending review' })
  pendingRefundCount: number;
}
