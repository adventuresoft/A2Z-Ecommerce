import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderItemInputDto } from './create-order.dto.js';

export class CreateAdminOrderItemInputDto extends OrderItemInputDto {
  @ApiPropertyOptional({
    description: 'Custom override unit price per item (optional)',
    example: 450.0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;
}

export class CreateAdminOrderDto {
  @ApiPropertyOptional({
    description: 'Existing customer User UUID. If omitted, user will be found or auto-created via customerEmail',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Customer email address for customer lookup or account creation',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

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
    description: 'Shipping delivery fee (default: 60 BDT)',
    example: 60,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingFee?: number = 60;

  @ApiPropertyOptional({
    description: 'Promotional or administrative discount amount',
    example: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number = 0;

  @ApiPropertyOptional({
    enum: OrderStatus,
    default: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus = OrderStatus.CONFIRMED;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus = PaymentStatus.PENDING;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;

  @ApiPropertyOptional({
    description: 'Payment transaction reference or receipt',
    example: 'TXN-984321',
  })
  @IsString()
  @IsOptional()
  paymentRef?: string;

  @ApiPropertyOptional({
    description: 'Special customer delivery instructions',
    example: 'Deliver during office hours',
  })
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'Internal administrative notes',
    example: 'Phone order taken by support agent',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiProperty({
    description: 'List of product variants and quantities to purchase',
    type: [CreateAdminOrderItemInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateAdminOrderItemInputDto)
  items: CreateAdminOrderItemInputDto[];
}
