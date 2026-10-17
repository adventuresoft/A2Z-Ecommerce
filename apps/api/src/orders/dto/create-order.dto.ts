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
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty({
    description: 'Product variant UUID to purchase',
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Quantity of items to purchase',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Full name of the recipient for delivery',
    example: 'Karim Ahmed',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  recipientName: string;

  @ApiProperty({
    description: 'Contact phone number of the recipient',
    example: '+8801712345678',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  recipientPhone: string;

  @ApiProperty({
    description: 'Street address, building, suite, or flat',
    example: 'House 12, Road 5, Block D, Banani',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingStreet: string;

  @ApiProperty({
    description: 'City / Municipality',
    example: 'Dhaka',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shippingCity: string;

  @ApiPropertyOptional({
    description: 'State / Division / Province',
    example: 'Dhaka Division',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shippingState?: string;

  @ApiProperty({
    description: 'Postal / ZIP code',
    example: '1213',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shippingPostalCode: string;

  @ApiPropertyOptional({
    description: 'Special customer delivery instructions',
    example: 'Please call before delivery',
  })
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiProperty({
    description: 'List of product variants and quantities to purchase',
    type: [OrderItemInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}
