import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

export class AccountOverviewCountsDto {
  @ApiProperty({ example: 12, description: 'Total lifetime orders placed by the customer' })
  totalOrders: number;

  @ApiProperty({ example: 2, description: 'Number of orders currently in PENDING status' })
  pendingOrders: number;

  @ApiProperty({ example: 1, description: 'Number of orders currently in PROCESSING or CONFIRMED status' })
  processingOrders: number;

  @ApiProperty({ example: 8, description: 'Number of successfully delivered orders' })
  deliveredOrders: number;

  @ApiProperty({ example: 1, description: 'Number of cancelled orders' })
  cancelledOrders: number;
}

export class AccountOverviewRecentOrderItemDto {
  @ApiProperty({ example: 'Apple MacBook Pro 16 M3 Max', description: 'Product title' })
  productTitle: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/macbook.jpg', description: 'Thumbnail URL' })
  thumbnailUrl?: string | null;

  @ApiProperty({ example: 1, description: 'Quantity ordered' })
  quantity: number;
}

export class AccountOverviewRecentOrderDto {
  @ApiProperty({ example: 'b5a03e1a-1234-4567-89ab-cdef01234567', description: 'Order UUID' })
  id: string;

  @ApiProperty({ example: 'AZ-2026-X8K2M9', description: 'Human-readable order number' })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.UNFULFILLED })
  shipmentStatus: ShipmentStatus;

  @ApiProperty({ example: 24500, description: 'Order grand total in BDT' })
  grandTotal: number;

  @ApiProperty({ example: 2, description: 'Total number of items in order' })
  itemCount: number;

  @ApiProperty({ example: '2026-10-25T10:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ type: [AccountOverviewRecentOrderItemDto], description: 'Line items preview' })
  itemsPreview: AccountOverviewRecentOrderItemDto[];
}

export class AccountOverviewAddressDto {
  @ApiProperty({ example: 'f3b2a1c0-1234-4567-89ab-cdef01234567' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  recipientName: string;

  @ApiProperty({ example: '+8801700000000' })
  phone: string;

  @ApiProperty({ example: 'House 12, Road 5, Dhanmondi' })
  streetAddress: string;

  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  state?: string | null;

  @ApiProperty({ example: '1209' })
  postalCode: string;

  @ApiProperty({ example: 'Bangladesh' })
  country: string;
}

export class AccountOverviewResponseDto {
  @ApiProperty({ type: AccountOverviewCountsDto, description: 'Aggregated order statistics' })
  counts: AccountOverviewCountsDto;

  @ApiProperty({ type: [AccountOverviewRecentOrderDto], description: 'Up to 5 most recent orders' })
  recentOrders: AccountOverviewRecentOrderDto[];

  @ApiPropertyOptional({ type: AccountOverviewAddressDto, nullable: true, description: 'Default shipping address' })
  defaultShippingAddress: AccountOverviewAddressDto | null;
}
