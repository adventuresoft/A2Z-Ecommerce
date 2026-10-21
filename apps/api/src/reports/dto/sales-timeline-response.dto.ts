import { ApiProperty } from '@nestjs/swagger';

export class SalesTimelinePointDto {
  @ApiProperty({ description: 'Date key for bucket (e.g. 2026-10-21)', example: '2026-10-21' })
  date: string;

  @ApiProperty({ description: 'Human-readable formatted date label', example: 'Oct 21, 2026' })
  label: string;

  @ApiProperty({ description: 'Number of orders placed in this period', example: 12 })
  orderCount: number;

  @ApiProperty({ description: 'Number of paid orders in this period', example: 10 })
  paidOrderCount: number;

  @ApiProperty({ description: 'Gross sales volume in BDT', example: 45000.0 })
  grossSales: number;

  @ApiProperty({ description: 'Net sales volume in BDT (gross minus refunds)', example: 43000.0 })
  netSales: number;

  @ApiProperty({ description: 'Promotional discounts applied', example: 1500.0 })
  discounts: number;

  @ApiProperty({ description: 'Shipping fees collected', example: 1800.0 })
  shipping: number;

  @ApiProperty({ description: 'Refunds processed for orders in this period', example: 2000.0 })
  refunds: number;

  @ApiProperty({ description: 'Quantity of items sold in this period', example: 34 })
  itemsSold: number;
}

export class SalesTimelineResponseDto {
  @ApiProperty({ type: [SalesTimelinePointDto] })
  timeline: SalesTimelinePointDto[];

  @ApiProperty({ description: 'Interval grouping used', example: 'day' })
  interval: string;
}
