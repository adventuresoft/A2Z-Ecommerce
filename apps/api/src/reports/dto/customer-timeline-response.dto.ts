import { ApiProperty } from '@nestjs/swagger';

export class CustomerTimelinePointDto {
  @ApiProperty({ description: 'Date key for bucket (e.g. YYYY-MM-DD)', example: '2026-10-15' })
  date: string;

  @ApiProperty({ description: 'Human readable label for point', example: 'Oct 15' })
  label: string;

  @ApiProperty({ description: 'Count of new customer registrations in this bucket', example: 5 })
  newRegistrations: number;

  @ApiProperty({ description: 'Count of distinct purchasing customers in this bucket', example: 12 })
  purchasingCustomers: number;

  @ApiProperty({ description: 'Total orders placed by customers in this bucket', example: 18 })
  ordersPlaced: number;

  @ApiProperty({ description: 'Total revenue generated in this bucket', example: 45000.0 })
  revenue: number;
}

export class CustomerTimelineResponseDto {
  @ApiProperty({ description: 'Array of chronological timeline points', type: [CustomerTimelinePointDto] })
  timeline: CustomerTimelinePointDto[];

  @ApiProperty({ description: 'Aggregation interval used', example: 'day' })
  interval: string;
}
