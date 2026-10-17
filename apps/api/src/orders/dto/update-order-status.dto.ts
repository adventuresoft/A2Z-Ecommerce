import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    description: 'Updated overall order lifecycle status',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Updated payment transaction status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Updated shipment tracking status',
    enum: ShipmentStatus,
    example: ShipmentStatus.DISPATCHED,
  })
  @IsEnum(ShipmentStatus)
  @IsOptional()
  shipmentStatus?: ShipmentStatus;

  @ApiPropertyOptional({
    description: 'Administrative notes or justification for the status change',
    example: 'Customer confirmed order by phone. Packed for dispatch.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
