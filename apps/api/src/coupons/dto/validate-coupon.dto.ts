import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({
    example: 'AZDEAL',
    description: 'Coupon code to validate',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    example: 2500.0,
    description: 'Order subtotal in BDT to evaluate eligibility and discount amount',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal!: number;
}
