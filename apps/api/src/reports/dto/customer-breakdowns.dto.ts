import { ApiProperty } from '@nestjs/swagger';

export class CustomerSegmentMetricDto {
  @ApiProperty({ description: 'Segment code identifier', example: 'VIP' })
  segment: string;

  @ApiProperty({ description: 'Human readable display label', example: 'VIP (> ৳10,000)' })
  label: string;

  @ApiProperty({ description: 'Number of customers in this segment', example: 28 })
  customerCount: number;

  @ApiProperty({ description: 'Percentage of total customers (0-100)', example: 14.0 })
  percentage: number;

  @ApiProperty({ description: 'Total cumulative revenue from customers in this segment', example: 380000.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Average revenue per customer in this segment', example: 13571.43 })
  averageSpent: number;
}

export class CustomerCityMetricDto {
  @ApiProperty({ description: 'Customer primary shipping city name', example: 'Dhaka' })
  city: string;

  @ApiProperty({ description: 'Count of unique customers in this city', example: 65 })
  customerCount: number;

  @ApiProperty({ description: 'Total orders placed from this city', example: 140 })
  orderCount: number;

  @ApiProperty({ description: 'Total revenue volume generated from this city', example: 350000.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Percentage of total purchasing customers in this city', example: 45.5 })
  percentage: number;
}

export class TopCustomerItemDto {
  @ApiProperty({ description: 'Customer unique identifier', example: 'usr-123' })
  id: string;

  @ApiProperty({ description: 'Customer full name', example: 'Rahim Chowdhury' })
  name: string;

  @ApiProperty({ description: 'Customer email address', example: 'rahim@example.com' })
  email: string;

  @ApiProperty({ description: 'Customer phone number', example: '+8801700000000', required: false })
  phone?: string | null;

  @ApiProperty({ description: 'Account active status', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Registration date in ISO format', example: '2026-01-10T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Total orders placed by customer', example: 12 })
  ordersCount: number;

  @ApiProperty({ description: 'Total revenue spent by customer', example: 48500.0 })
  totalSpent: number;

  @ApiProperty({ description: 'Average order value for customer', example: 4041.67 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Date of last placed order', example: '2026-10-18T14:30:00.000Z', required: false })
  lastOrderDate?: string | null;

  @ApiProperty({ description: 'Primary shipping destination city', example: 'Dhaka', required: false })
  primaryCity?: string | null;
}
