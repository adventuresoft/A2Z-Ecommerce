import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, OrderStatus } from '@prisma/client';

export type CouponComputedStatus =
  | 'LIVE'
  | 'SCHEDULED'
  | 'EXPIRED'
  | 'EXHAUSTED'
  | 'INACTIVE';

export class CouponUsageItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  orderId!: string;

  @ApiProperty({ example: 'AZ-2026-0001' })
  orderNumber!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  orderStatus!: OrderStatus;

  @ApiProperty({ example: 4500.0 })
  orderGrandTotal!: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  userId!: string;

  @ApiProperty({ example: 'Tanvir Hassan' })
  customerName!: string;

  @ApiProperty({ example: 'customer@az-ecommerce.local' })
  customerEmail!: string;

  @ApiProperty({ example: 500.0 })
  discountApplied!: number;

  @ApiProperty()
  usedAt!: Date;
}

export class CouponResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'AZDEAL' })
  code!: string;

  @ApiPropertyOptional({ example: 'Flat ৳500 discount on orders over ৳1,000' })
  description?: string | null;

  @ApiProperty({ enum: DiscountType, example: DiscountType.FIXED_AMOUNT })
  discountType!: DiscountType;

  @ApiProperty({ example: 500.0 })
  discountValue!: number;

  @ApiPropertyOptional({ example: 1000.0 })
  minOrderAmount?: number | null;

  @ApiPropertyOptional({ example: 2000.0 })
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({ example: 1000 })
  totalUsageLimit?: number | null;

  @ApiProperty({ example: 1 })
  perCustomerLimit!: number;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 14, description: 'Number of times this coupon has been redeemed' })
  usagesCount!: number;

  @ApiProperty({ example: 7000.0, description: 'Total discount amount (BDT) granted by this coupon' })
  totalDiscountGiven!: number;

  @ApiProperty({
    enum: ['LIVE', 'SCHEDULED', 'EXPIRED', 'EXHAUSTED', 'INACTIVE'],
    example: 'LIVE',
  })
  computedStatus!: CouponComputedStatus;

  @ApiPropertyOptional({ type: [CouponUsageItemDto] })
  usages?: CouponUsageItemDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedCouponResponseDto {
  @ApiProperty({ type: [CouponResponseDto] })
  items!: CouponResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export class CouponStatsResponseDto {
  @ApiProperty({ example: 8 })
  totalCoupons!: number;

  @ApiProperty({ example: 5 })
  liveCoupons!: number;

  @ApiProperty({ example: 1 })
  scheduledCoupons!: number;

  @ApiProperty({ example: 2 })
  expiredOrExhaustedCoupons!: number;

  @ApiProperty({ example: 42 })
  totalRedemptions!: number;

  @ApiProperty({ example: 24500.0 })
  totalDiscountGranted!: number;
}
