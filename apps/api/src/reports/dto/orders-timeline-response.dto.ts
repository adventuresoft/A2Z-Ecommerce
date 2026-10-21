import { ApiProperty } from '@nestjs/swagger';

export class OrdersTimelinePointDto {
  @ApiProperty({ description: 'Bucket date key (e.g. 2026-10-15 or 2026-10)', example: '2026-10-15' })
  date: string;

  @ApiProperty({ description: 'Human readable display label', example: 'Oct 15, 2026' })
  label: string;

  @ApiProperty({ description: 'Total orders placed in this bucket', example: 14 })
  totalOrders: number;

  @ApiProperty({ description: 'Orders delivered in this bucket', example: 8 })
  deliveredOrders: number;

  @ApiProperty({ description: 'Orders in active processing/transit in this bucket', example: 5 })
  processingOrders: number;

  @ApiProperty({ description: 'Orders cancelled in this bucket', example: 1 })
  cancelledOrders: number;

  @ApiProperty({ description: 'Orders returned in this bucket', example: 0 })
  returnedOrders: number;

  @ApiProperty({ description: 'Total monetary value of orders in this bucket', example: 42000.0 })
  totalValue: number;

  @ApiProperty({ description: 'Total items ordered in this bucket', example: 38 })
  itemsCount: number;
}

export class OrdersTimelineResponseDto {
  @ApiProperty({
    description: 'Array of sequential order timeline data points',
    type: [OrdersTimelinePointDto],
  })
  timeline: OrdersTimelinePointDto[];

  @ApiProperty({
    description: 'Applied bucket interval',
    example: 'day',
    enum: ['day', 'week', 'month'],
  })
  interval: string;
}
