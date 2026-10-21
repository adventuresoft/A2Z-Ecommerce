import { ApiProperty } from '@nestjs/swagger';

export class CustomerReportRecordDto {
  @ApiProperty({ description: 'Customer unique identifier', example: 'usr-123' })
  id: string;

  @ApiProperty({ description: 'Customer full name', example: 'Rahim Chowdhury' })
  name: string;

  @ApiProperty({ description: 'Customer login email address', example: 'rahim@example.com' })
  email: string;

  @ApiProperty({ description: 'Customer telephone contact number', example: '+8801700000000', required: false })
  phone?: string | null;

  @ApiProperty({ description: 'Customer account active flag', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Registration date in ISO format', example: '2026-02-14T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Total lifetime orders placed', example: 8 })
  ordersCount: number;

  @ApiProperty({ description: 'Delivered orders count', example: 7 })
  deliveredOrdersCount: number;

  @ApiProperty({ description: 'Cancelled orders count', example: 1 })
  cancelledOrdersCount: number;

  @ApiProperty({ description: 'Cumulative grand total expenditure', example: 32500.0 })
  totalSpent: number;

  @ApiProperty({ description: 'Average order basket value', example: 4062.5 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Date of most recent order', example: '2026-10-15T12:00:00.000Z', required: false })
  lastOrderDate?: string | null;

  @ApiProperty({ description: 'Primary shipping destination city', example: 'Dhaka', required: false })
  primaryCity?: string | null;

  @ApiProperty({ description: 'Total product reviews submitted', example: 3 })
  reviewsCount: number;

  @ApiProperty({ description: 'Assigned customer value tier', example: 'VIP' })
  spendingTier: string;
}

export class CustomerReportListResponseDto {
  @ApiProperty({ description: 'Array of customer report records', type: [CustomerReportRecordDto] })
  items: CustomerReportRecordDto[];

  @ApiProperty({ description: 'Total matching customer records', example: 250 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size limit', example: 15 })
  limit: number;

  @ApiProperty({ description: 'Total calculated pages', example: 17 })
  totalPages: number;
}
