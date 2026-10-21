import { ApiProperty } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';

export class OrdersReportItemSummaryDto {
  @ApiProperty({ description: 'Order Item ID' })
  id: string;

  @ApiProperty({ description: 'Product title', example: 'Premium Cotton T-Shirt' })
  productTitle: string;

  @ApiProperty({ description: 'SKU code', example: 'TSH-BLK-M' })
  sku: string;

  @ApiProperty({ description: 'Variant attributes', example: 'Color: Black, Size: M', nullable: true })
  variantAttributes: string | null;

  @ApiProperty({ description: 'Unit price', example: 1200.0 })
  unitPrice: number;

  @ApiProperty({ description: 'Ordered quantity', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Line total', example: 2400.0 })
  totalPrice: number;
}

export class OrdersReportRecordDto {
  @ApiProperty({ description: 'Unique Order UUID' })
  id: string;

  @ApiProperty({ description: 'Human-readable order tracking number', example: 'ORD-20261021-001' })
  orderNumber: string;

  @ApiProperty({ description: 'Creation date timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Customer recipient name', example: 'Rahim Ahmed' })
  customerName: string;

  @ApiProperty({ description: 'Customer account email', example: 'rahim@example.com' })
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone number', example: '+8801711223344' })
  recipientPhone: string;

  @ApiProperty({ description: 'Shipping destination street address' })
  shippingStreet: string;

  @ApiProperty({ description: 'Shipping destination city', example: 'Dhaka' })
  shippingCity: string;

  @ApiProperty({ description: 'Shipping postal code', example: '1212' })
  shippingPostalCode: string;

  @ApiProperty({ description: 'Current order lifecycle status', enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Shipment fulfillment status', enum: ShipmentStatus })
  shipmentStatus: ShipmentStatus;

  @ApiProperty({ description: 'Payment method utilized', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @ApiProperty({ description: 'Assigned courier name', example: 'Pathao Courier', nullable: true })
  courierName: string | null;

  @ApiProperty({ description: 'Shipment tracking number', example: 'PTH-992123', nullable: true })
  trackingNumber: string | null;

  @ApiProperty({ description: 'Total item units count', example: 3 })
  itemsCount: number;

  @ApiProperty({ description: 'Subtotal value before discounts and shipping', example: 3500.0 })
  subtotal: number;

  @ApiProperty({ description: 'Promotional discount amount', example: 300.0 })
  discountAmount: number;

  @ApiProperty({ description: 'Shipping fee', example: 100.0 })
  shippingFee: number;

  @ApiProperty({ description: 'Final grand total amount', example: 3300.0 })
  grandTotal: number;

  @ApiProperty({
    description: 'Line items within this order',
    type: [OrdersReportItemSummaryDto],
    required: false,
  })
  items?: OrdersReportItemSummaryDto[];
}

export class OrdersReportListResponseDto {
  @ApiProperty({
    description: 'List of order records matching filters',
    type: [OrdersReportRecordDto],
  })
  items: OrdersReportRecordDto[];

  @ApiProperty({ description: 'Total matching orders count', example: 124 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page limit size', example: 15 })
  limit: number;

  @ApiProperty({ description: 'Total available pages', example: 9 })
  totalPages: number;
}
