import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({
    example: 'AZDEAL',
    description: 'Unique promotional coupon code (automatically normalized to uppercase)',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({
    example: 'Flat ৳500 discount on orders over ৳1,000',
    description: 'Customer/Admin-facing summary of the promotional campaign',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.FIXED_AMOUNT,
    description: 'Calculation method: FIXED_AMOUNT (BDT) or PERCENTAGE (%)',
  })
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @ApiProperty({
    example: 500.0,
    description: 'Discount value (in BDT for FIXED_AMOUNT, or 1–100 for PERCENTAGE)',
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  discountValue!: number;

  @ApiPropertyOptional({
    example: 1000.0,
    description: 'Minimum order subtotal (BDT) required to apply this coupon',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minOrderAmount?: number | null;

  @ApiPropertyOptional({
    example: 2000.0,
    description: 'Maximum discount amount cap (BDT), primarily for PERCENTAGE coupons',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Total global redemptions allowed across all customers (null for unlimited)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalUsageLimit?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'Maximum times a single customer account can redeem this coupon',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  perCustomerLimit?: number;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'ISO 8601 start timestamp when coupon becomes valid',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2027-12-31T23:59:59.000Z',
    description: 'ISO 8601 end timestamp when coupon expires',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this coupon is active and redeemable',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
