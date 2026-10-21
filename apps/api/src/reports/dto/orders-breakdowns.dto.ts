import { ApiProperty } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';

export class OrderStatusMetricDto {
  @ApiProperty({ description: 'Order lifecycle status enum', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Order count in this status', example: 25 })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 35.5 })
  percentage: number;

  @ApiProperty({ description: 'Cumulative grand total of orders in this status', example: 78000.0 })
  totalAmount: number;

  @ApiProperty({ description: 'Average order value in this status', example: 3120.0 })
  averageAmount: number;
}

export class ShipmentStatusMetricDto {
  @ApiProperty({ description: 'Shipment fulfillment status enum', enum: ShipmentStatus })
  status: ShipmentStatus;

  @ApiProperty({ description: 'Order count in this fulfillment status', example: 18 })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 22.5 })
  percentage: number;

  @ApiProperty({ description: 'Cumulative grand total of orders in this shipment status', example: 54000.0 })
  totalAmount: number;
}

export class PaymentStatusMetricDto {
  @ApiProperty({ description: 'Payment status enum', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Order count in this payment status', example: 64 })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 80.0 })
  percentage: number;

  @ApiProperty({ description: 'Cumulative grand total of orders in this payment status', example: 195000.0 })
  totalAmount: number;
}

export class ShippingCityMetricDto {
  @ApiProperty({ description: 'Destination city name', example: 'Dhaka' })
  city: string;

  @ApiProperty({ description: 'Orders shipped to this city', example: 45 })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 56.25 })
  percentage: number;

  @ApiProperty({ description: 'Total revenue volume generated from this city', example: 135000.0 })
  totalAmount: number;
}

export class ShippingMethodMetricDto {
  @ApiProperty({ description: 'Courier shipping method name', example: 'Standard Delivery' })
  methodName: string;

  @ApiProperty({ description: 'Associated shipping zone name', example: 'Inside Dhaka', required: false })
  zoneName?: string;

  @ApiProperty({ description: 'Orders fulfilled via this method', example: 32 })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders (0-100)', example: 40.0 })
  percentage: number;

  @ApiProperty({ description: 'Total shipping fees collected for this method', example: 2560.0 })
  totalShippingFee: number;
}
