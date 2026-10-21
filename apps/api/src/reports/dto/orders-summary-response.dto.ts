import { ApiProperty } from '@nestjs/swagger';

export class OrdersSummaryResponseDto {
  @ApiProperty({ description: 'Total count of orders within the period', example: 120 })
  totalOrders: number;

  @ApiProperty({ description: 'Total accumulated grand total value across all orders', example: 350000.0 })
  totalOrderValue: number;

  @ApiProperty({ description: 'Average order value (Total Value / Total Orders)', example: 2916.67 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Total quantity of physical items ordered', example: 380 })
  totalItemsOrdered: number;

  @ApiProperty({ description: 'Average items per order basket size', example: 3.17 })
  averageItemsPerOrder: number;

  @ApiProperty({ description: 'Count of orders in PENDING status', example: 12 })
  pendingOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in CONFIRMED status', example: 15 })
  confirmedOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in PROCESSING status', example: 18 })
  processingOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in SHIPPED status', example: 25 })
  shippedOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in DELIVERED status', example: 40 })
  deliveredOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in CANCELLED status', example: 6 })
  cancelledOrdersCount: number;

  @ApiProperty({ description: 'Count of orders in RETURNED status', example: 4 })
  returnedOrdersCount: number;

  @ApiProperty({ description: 'Fulfillment / delivery completion rate (Delivered / Total Orders %)', example: 33.33 })
  fulfillmentRate: number;

  @ApiProperty({ description: 'Cancellation rate (Cancelled / Total Orders %)', example: 5.0 })
  cancellationRate: number;

  @ApiProperty({ description: 'Return rate (Returned / Total Orders %)', example: 3.33 })
  returnRate: number;

  @ApiProperty({ description: 'Count of paid orders', example: 85 })
  paidOrdersCount: number;

  @ApiProperty({ description: 'Count of orders with pending payment (e.g. COD)', example: 30 })
  pendingPaymentCount: number;

  @ApiProperty({ description: 'Count of orders with failed payment', example: 2 })
  failedPaymentCount: number;

  @ApiProperty({ description: 'Count of orders with refunded payment', example: 3 })
  refundedOrdersCount: number;

  @ApiProperty({ description: 'Store currency code', example: 'BDT' })
  currency: string;

  @ApiProperty({ description: 'Filter start date in ISO format', required: false })
  startDate?: string;

  @ApiProperty({ description: 'Filter end date in ISO format', required: false })
  endDate?: string;
}
