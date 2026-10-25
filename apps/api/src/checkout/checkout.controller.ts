import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service.js';
import {
  CalculateCheckoutDto,
  CheckoutCalculationResponseDto,
} from './dto/index.js';

@ApiTags('Checkout & Calculations')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Authoritatively calculate checkout subtotal, line VAT, shipping fees, coupon discounts, and inventory availability',
  })
  @ApiResponse({
    status: 200,
    description: 'Authoritative checkout calculation breakdown',
    type: CheckoutCalculationResponseDto,
  })
  async calculate(
    @Body() dto: CalculateCheckoutDto,
    @Req() req: Request,
  ): Promise<CheckoutCalculationResponseDto> {
    let userId: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload?.sub) {
          userId = payload.sub;
        }
      } catch {
        // Silently proceed as guest calculation if token is invalid or malformed
      }
    }

    return this.checkoutService.calculateCheckout(dto, userId);
  }
}
