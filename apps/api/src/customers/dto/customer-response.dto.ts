import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerAddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiProperty()
  recipientName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  streetAddress: string;

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  state?: string | null;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  isDefaultShipping: boolean;

  @ApiProperty()
  isDefaultBilling: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class CustomerItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  emailVerifiedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Total non-cancelled orders count' })
  ordersCount: number;

  @ApiProperty({ description: 'Total monetary spend across non-cancelled orders' })
  totalSpent: number;

  @ApiProperty({ description: 'Average order value' })
  averageOrderValue: number;

  @ApiPropertyOptional({ description: 'Timestamp of most recent order' })
  lastOrderDate?: string | null;

  @ApiProperty({ description: 'VIP, REGULAR, ONE_TIME, or ZERO_ORDER' })
  spendingTier: string;

  @ApiPropertyOptional({ description: 'Primary shipping destination city' })
  primaryCity?: string | null;
}

export class PaginatedCustomersResponseDto {
  @ApiProperty({ type: [CustomerItemDto] })
  items: CustomerItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class CustomerStatsResponseDto {
  @ApiProperty()
  totalCustomers: number;

  @ApiProperty()
  activeCustomers: number;

  @ApiProperty()
  inactiveCustomers: number;

  @ApiProperty()
  vipCustomers: number;

  @ApiProperty()
  regularCustomers: number;

  @ApiProperty()
  repeatCustomers: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageOrderValue: number;
}

export class CustomerOrderSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  orderStatus: string;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty()
  shipmentStatus: string;

  @ApiProperty()
  grandTotal: number;

  @ApiProperty()
  itemsCount: number;

  @ApiPropertyOptional()
  paymentMethod?: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class CustomerReviewSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isVerifiedPurchase: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  productSlug: string;
}

export class CustomerDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  emailVerifiedAt?: Date | null;

  @ApiProperty()
  tokenVersion: number;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  ordersCount: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  averageOrderValue: number;

  @ApiPropertyOptional()
  lastOrderDate?: string | null;

  @ApiProperty()
  spendingTier: string;

  @ApiProperty()
  cancelledOrdersCount: number;

  @ApiProperty({ type: [CustomerAddressDto] })
  addresses: CustomerAddressDto[];

  @ApiProperty({ type: [CustomerOrderSummaryDto] })
  recentOrders: CustomerOrderSummaryDto[];

  @ApiProperty({ type: [CustomerReviewSummaryDto] })
  reviews: CustomerReviewSummaryDto[];
}
