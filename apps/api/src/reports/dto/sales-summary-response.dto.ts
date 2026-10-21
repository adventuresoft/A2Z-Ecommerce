import { ApiProperty } from '@nestjs/swagger';

export class SalesSummaryResponseDto {
  @ApiProperty({ description: 'Total gross sales (subtotal + shipping - discounts)', example: 125000.5 })
  grossSales: number;

  @ApiProperty({ description: 'Net sales (gross sales minus refunds)', example: 118000.5 })
  netSales: number;

  @ApiProperty({ description: 'Total number of orders within period', example: 48 })
  totalOrders: number;

  @ApiProperty({ description: 'Count of orders with PAID status', example: 42 })
  paidOrdersCount: number;

  @ApiProperty({ description: 'Count of pending orders', example: 4 })
  pendingOrdersCount: number;

  @ApiProperty({ description: 'Count of successfully delivered orders', example: 38 })
  deliveredOrdersCount: number;

  @ApiProperty({ description: 'Count of cancelled orders', example: 2 })
  cancelledOrdersCount: number;

  @ApiProperty({ description: 'Count of returned orders', example: 1 })
  returnedOrdersCount: number;

  @ApiProperty({ description: 'Total discount amount deducted', example: 4500.0 })
  totalDiscounts: number;

  @ApiProperty({ description: 'Total courier shipping fees collected', example: 5200.0 })
  totalShipping: number;

  @ApiProperty({ description: 'Total completed refund value issued', example: 7000.0 })
  totalRefunds: number;

  @ApiProperty({ description: 'Total physical product items sold', example: 126 })
  totalItemsSold: number;

  @ApiProperty({ description: 'Average order value (Gross Sales / Total Orders)', example: 2604.18 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Store currency code', example: 'BDT' })
  currency: string;

  @ApiProperty({ description: 'Filter start date in ISO format', required: false })
  startDate?: string;

  @ApiProperty({ description: 'Filter end date in ISO format', required: false })
  endDate?: string;
}
