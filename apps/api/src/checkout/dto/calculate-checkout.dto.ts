import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({
    description: 'Product variant UUID',
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({
    description: 'Quantity to purchase',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CalculateCheckoutDto {
  @ApiProperty({
    description: 'List of product variants and quantities to calculate',
    type: [CheckoutItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'Optional shipping method UUID',
    example: 's-method-uuid',
  })
  @IsUUID()
  @IsOptional()
  shippingMethodId?: string;

  @ApiPropertyOptional({
    description: 'Shipping destination city / division (e.g. Dhaka vs Outside Dhaka)',
    example: 'Dhaka',
  })
  @IsString()
  @IsOptional()
  shippingCity?: string;

  @ApiPropertyOptional({
    description: 'Optional promotional coupon code to apply',
    example: 'AZDEAL',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class CheckoutItemValidationDto {
  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  productTitle!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  totalPrice!: number;

  @ApiProperty()
  availableQuantity!: number;

  @ApiProperty()
  isValid!: boolean;

  @ApiPropertyOptional()
  errorMessage?: string;
}

export class CheckoutCouponSummaryDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  discountType!: string;

  @ApiProperty()
  discountValue!: number;

  @ApiPropertyOptional()
  description?: string | null;
}

export class CheckoutShippingMethodSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  estimatedDays!: number;

  @ApiProperty()
  cost!: number;
}

export class CheckoutCalculationResponseDto {
  @ApiProperty({ description: 'Total price of all valid items before discounts or delivery' })
  subtotal!: number;

  @ApiProperty({ description: 'Promotional discount amount applied' })
  discountAmount!: number;

  @ApiPropertyOptional({ type: CheckoutCouponSummaryDto })
  coupon?: CheckoutCouponSummaryDto | null;

  @ApiProperty({ description: 'Authoritative shipping fee' })
  shippingFee!: number;

  @ApiPropertyOptional({ type: CheckoutShippingMethodSummaryDto })
  shippingMethod?: CheckoutShippingMethodSummaryDto | null;

  @ApiProperty({ description: 'Reverse-extracted VAT tax amount included in subtotal' })
  totalTaxAmount!: number;

  @ApiProperty({ description: 'Final payable amount: subtotal - discountAmount + shippingFee' })
  grandTotal!: number;

  @ApiProperty({ type: [CheckoutItemValidationDto] })
  itemsValidation!: CheckoutItemValidationDto[];

  @ApiProperty({ description: 'Whether all items are in stock and order can proceed' })
  isEligibleForCheckout!: boolean;
}
