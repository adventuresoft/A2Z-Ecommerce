import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class InitiatePaystationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order ID or Order Number to pay for',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/checkout/payment-callback',
    description: 'Optional custom callback URL after payment completion',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackUrl?: string;
}

export class VerifyPaystationDto {
  @ApiProperty({
    example: 'ORD-20261031-ABCD',
    description: 'Invoice number / Order number returned by PayStation gateway',
  })
  @IsNotEmpty()
  @IsString()
  invoice_number: string;
}

export class PaystationInitiateResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'https://sandbox.paystation.com.bd/checkout/123/xyz' })
  payment_url: string;

  @ApiProperty({ example: 'ORD-20261031-ABCD' })
  invoice_number: string;

  @ApiPropertyOptional({ example: 'Payment Link Created Successfully.' })
  message?: string;
}

export class PaystationVerifyResponseDto {
  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ example: 'Success' })
  status: string;

  @ApiPropertyOptional({ example: 'TRX9876543210' })
  trx_id?: string;

  @ApiProperty({ example: 'ORD-20261031-ABCD' })
  orderNumber: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  orderId?: string;

  @ApiPropertyOptional({ example: 'Payment verified and order confirmed successfully' })
  message?: string;
}
