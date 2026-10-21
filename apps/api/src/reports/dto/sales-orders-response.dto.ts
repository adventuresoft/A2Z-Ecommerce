import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod, PaymentStatus, ShipmentStatus } from '@prisma/client';

export class SalesOrderItemDto {
  @ApiProperty({ description: 'Order line ID' })
  id: string;

  @ApiProperty({ description: 'Product title snapshot' })
  productTitle: string;

  @ApiProperty({ description: 'SKU code' })
  sku: string;

  @ApiProperty({ description: 'Variant options snapshot', required: false, nullable: true })
  variantAttributes: string | null;

  @ApiProperty({ description: 'Price per unit' })
  unitPrice: number;

  @ApiProperty({ description: 'Quantity purchased' })
  quantity: number;

  @ApiProperty({ description: 'Total item line amount' })
  totalPrice: number;
}

export class SalesOrderRecordDto {
  @ApiProperty({ description: 'Order UUID' })
  id: string;

  @ApiProperty({ description: 'Order reference number', example: 'AZ-2026-X8K2M9' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  customerEmail: string;

  @ApiProperty({ description: 'Customer recipient phone' })
  recipientPhone: string;

  @ApiProperty({ description: 'Order creation timestamp in ISO format' })
  createdAt: string;

  @ApiProperty({ enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: ShipmentStatus })
  shipmentStatus: ShipmentStatus;

  @ApiProperty({ enum: PaymentMethod, description: 'Primary payment method', nullable: true })
  paymentMethod: PaymentMethod | null;

  @ApiProperty({ description: 'Total line items count' })
  itemsCount: number;

  @ApiProperty({ description: 'Order subtotal in BDT' })
  subtotal: number;

  @ApiProperty({ description: 'Discount applied in BDT' })
  discountAmount: number;

  @ApiProperty({ description: 'Shipping charge in BDT' })
  shippingFee: number;

  @ApiProperty({ description: 'Grand total payable in BDT' })
  grandTotal: number;

  @ApiProperty({ description: 'Total refunded amount in BDT' })
  refundAmount: number;

  @ApiProperty({ description: 'Net realized revenue (grandTotal - refundAmount)' })
  netAmount: number;

  @ApiProperty({ type: [SalesOrderItemDto], required: false })
  items?: SalesOrderItemDto[];
}

export class PaginatedSalesOrdersResponseDto {
  @ApiProperty({ type: [SalesOrderRecordDto] })
  items: SalesOrderRecordDto[];

  @ApiProperty({ description: 'Total matching orders', example: 120 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Records per page', example: 15 })
  limit: number;

  @ApiProperty({ description: 'Total pages available', example: 8 })
  totalPages: number;
}
