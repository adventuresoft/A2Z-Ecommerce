import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

export class OrderItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  variantId?: string | null;

  @ApiProperty({ example: 'Premium Cotton T-Shirt' })
  productTitle: string;

  @ApiProperty({ example: 'TSHIRT-BLK-XL' })
  sku: string;

  @ApiPropertyOptional({ example: 'Color: Black, Size: XL' })
  variantAttributes?: string | null;

  @ApiProperty({ example: 450.0 })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 900.0 })
  totalPrice: number;

  @ApiPropertyOptional({ example: 'https://images.example.com/tshirt.png' })
  thumbnailUrl?: string | null;
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiPropertyOptional({ enum: OrderStatus, example: OrderStatus.PENDING })
  fromStatus?: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  toStatus: OrderStatus;

  @ApiPropertyOptional({ example: 'Verified with customer via telephone' })
  notes?: string | null;

  @ApiPropertyOptional({ example: 'John Admin' })
  changedByUserName?: string | null;

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  createdAt: Date;
}

export class OrderShipmentSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Steadfast Courier' })
  courierName: string;

  @ApiPropertyOptional({ example: 'ST-2026-987654' })
  trackingNumber?: string | null;

  @ApiPropertyOptional({ example: 'https://steadfast.com.bd/t/ST-2026-987654' })
  trackingUrl?: string | null;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.PREPARING })
  status: ShipmentStatus;

  @ApiPropertyOptional({ example: '2026-10-17T12:00:00.000Z' })
  shippedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-10-17T15:00:00.000Z' })
  deliveredAt?: Date | null;

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  createdAt: Date;
}

export class OrderPaymentSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'CASH_ON_DELIVERY' })
  method: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 960.0 })
  amount: number;

  @ApiPropertyOptional({ example: 'COD-REC-12345' })
  transactionRef?: string | null;

  @ApiPropertyOptional({ example: '2026-10-17T12:00:00.000Z' })
  paidAt?: Date | null;

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  createdAt: Date;
}

export class OrderRefundSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174099' })
  id: string;

  @ApiProperty({ example: 350.0 })
  amount: number;

  @ApiProperty({ example: 'COMPLETED' })
  status: string;

  @ApiProperty({ example: 'Damaged item return' })
  reason: string;

  @ApiPropertyOptional({ example: 'REFUND-SLIP-123' })
  transactionRef?: string | null;

  @ApiProperty({ example: '2026-10-17T14:00:00.000Z' })
  createdAt: Date;
}

export class OrderResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ example: 'AZ-2026-AB12CD' })
  orderNumber: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  userId: string;

  @ApiPropertyOptional({ example: 'Karim Ahmed' })
  customerName?: string;

  @ApiPropertyOptional({ example: 'customer@az-ecommerce.local' })
  customerEmail?: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.UNFULFILLED })
  shipmentStatus: ShipmentStatus;

  @ApiProperty({ example: 900.0 })
  subtotal: number;

  @ApiProperty({ example: 0.0 })
  discountAmount: number;

  @ApiProperty({ example: 60.0 })
  shippingFee: number;

  @ApiProperty({ example: 960.0 })
  grandTotal: number;

  @ApiProperty({ example: 'Karim Ahmed' })
  recipientName: string;

  @ApiProperty({ example: '+8801712345678' })
  recipientPhone: string;

  @ApiProperty({ example: 'House 12, Road 5, Banani' })
  shippingStreet: string;

  @ApiProperty({ example: 'Dhaka' })
  shippingCity: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  shippingState?: string | null;

  @ApiProperty({ example: '1213' })
  shippingPostalCode: string;

  @ApiPropertyOptional({ example: 'Please ring the doorbell' })
  customerNotes?: string | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({ type: [OrderStatusHistoryResponseDto] })
  statusHistory?: OrderStatusHistoryResponseDto[];

  @ApiPropertyOptional({ type: [OrderShipmentSummaryDto] })
  shipments?: OrderShipmentSummaryDto[];

  @ApiPropertyOptional({ type: [OrderPaymentSummaryDto] })
  payments?: OrderPaymentSummaryDto[];

  @ApiPropertyOptional({ type: [OrderRefundSummaryDto] })
  refunds?: OrderRefundSummaryDto[];

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedOrdersResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty({
    example: {
      total: 42,
      page: 1,
      limit: 10,
      totalPages: 5,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
