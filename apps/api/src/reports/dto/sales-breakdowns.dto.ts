import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class PaymentMethodBreakdownDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH_ON_DELIVERY })
  method: PaymentMethod;

  @ApiProperty({ description: 'Number of orders placed using this method', example: 35 })
  orderCount: number;

  @ApiProperty({ description: 'Gross sales value processed', example: 85000.0 })
  totalAmount: number;

  @ApiProperty({ description: 'Percentage of total sales volume (0-100)', example: 68.0 })
  percentage: number;
}

export class OrderStatusBreakdownDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.DELIVERED })
  status: OrderStatus;

  @ApiProperty({ description: 'Number of orders in this status', example: 32 })
  orderCount: number;

  @ApiProperty({ description: 'Total monetary value of these orders', example: 78000.0 })
  totalAmount: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 64.0 })
  percentage: number;
}

export class CategorySalesBreakdownDto {
  @ApiProperty({ description: 'Category UUID', example: 'cat-uuid-1' })
  categoryId: string;

  @ApiProperty({ description: 'Category name', example: 'Electronics' })
  categoryName: string;

  @ApiProperty({ description: 'Order count with items in this category', example: 28 })
  orderCount: number;

  @ApiProperty({ description: 'Total units sold in this category', example: 74 })
  quantitySold: number;

  @ApiProperty({ description: 'Total gross sales generated in this category', example: 62000.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Percentage share of total category revenue', example: 45.5 })
  percentage: number;
}

export class TopSellingProductDto {
  @ApiProperty({ description: 'Variant UUID', required: false, nullable: true })
  variantId: string | null;

  @ApiProperty({ description: 'Product UUID', required: false, nullable: true })
  productId: string | null;

  @ApiProperty({ description: 'Product title', example: 'AirPods Pro 2nd Gen' })
  productTitle: string;

  @ApiProperty({ description: 'SKU code', example: 'APP-APP-PRO2-WHT' })
  sku: string;

  @ApiProperty({ description: 'Category name', example: 'Audio & Headphones' })
  categoryName: string;

  @ApiProperty({ description: 'Thumbnail URL if available', required: false, nullable: true })
  thumbnailUrl: string | null;

  @ApiProperty({ description: 'Total units sold', example: 24 })
  quantitySold: number;

  @ApiProperty({ description: 'Total gross revenue from this product', example: 54000.0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Average realized price per unit', example: 2250.0 })
  averagePrice: number;
}
