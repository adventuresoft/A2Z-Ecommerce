import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatus } from '@prisma/client';

export class ShipmentStatusHistoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ enum: ShipmentStatus, example: ShipmentStatus.PREPARING })
  fromStatus?: ShipmentStatus | null;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.DISPATCHED })
  toStatus: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Package picked up by courier' })
  notes?: string | null;

  @ApiPropertyOptional({ example: 'Admin User' })
  changedByUserName?: string | null;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  createdAt: Date;
}

export class ShipmentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  orderId: string;

  @ApiPropertyOptional({ example: 'AZ-2026-AB12CD' })
  orderNumber?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ example: 'Standard Courier Delivery' })
  shippingMethodName?: string | null;

  @ApiProperty({ example: 'Steadfast Courier' })
  courierName: string;

  @ApiPropertyOptional({ example: 'ST-2026-987654' })
  trackingNumber?: string | null;

  @ApiPropertyOptional({ example: 'https://steadfast.com.bd/t/ST-2026-987654' })
  trackingUrl?: string | null;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.PREPARING })
  status: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Handle with care' })
  notes?: string | null;

  @ApiPropertyOptional({ example: 'Karim Ahmed' })
  recipientName?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  recipientPhone?: string;

  @ApiPropertyOptional({ example: 'House 12, Road 5, Banani' })
  shippingStreet?: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  shippingCity?: string;

  @ApiPropertyOptional({ example: '2026-10-17T12:00:00.000Z' })
  shippedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-10-17T15:00:00.000Z' })
  deliveredAt?: Date | null;

  @ApiProperty({ type: () => [ShipmentStatusHistoryResponseDto] })
  statusHistory: ShipmentStatusHistoryResponseDto[];

  @ApiProperty({ example: '2026-10-17T11:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-17T12:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedShipmentsResponseDto {
  @ApiProperty({ type: [ShipmentResponseDto] })
  data: ShipmentResponseDto[];

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

export class PublicTrackingResponseDto {
  @ApiProperty({ example: 'ST-2026-987654' })
  trackingNumber: string;

  @ApiProperty({ example: 'Steadfast Courier' })
  courierName: string;

  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.IN_TRANSIT })
  status: ShipmentStatus;

  @ApiPropertyOptional({ example: 'https://steadfast.com.bd/t/ST-2026-987654' })
  trackingUrl?: string | null;

  @ApiPropertyOptional({ example: '2026-10-17T12:00:00.000Z' })
  shippedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-10-17T15:00:00.000Z' })
  deliveredAt?: Date | null;

  @ApiProperty({ type: () => [ShipmentStatusHistoryResponseDto] })
  statusHistory: ShipmentStatusHistoryResponseDto[];
}
