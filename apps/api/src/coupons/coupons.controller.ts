import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CouponsService } from './coupons.service.js';
import { CouponResponseDto, ValidateCouponDto } from './dto/index.js';

@ApiTags('Public Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('active')
  @ApiOperation({
    summary: 'List currently active and valid promotional coupons for storefront discovery',
  })
  @ApiResponse({ status: 200, type: [CouponResponseDto] })
  async getActiveCoupons(): Promise<CouponResponseDto[]> {
    return this.couponsService.findActivePublic();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a coupon code against an order subtotal and return calculated discount',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon validated and discount calculated',
  })
  @ApiResponse({
    status: 400,
    description: 'Coupon invalid, expired, or ineligible',
  })
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
    @Req() req: Request,
  ) {
    let userId: string | undefined;
    const authHeader = req.headers['authorization'];
    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload?.sub) {
          userId = payload.sub;
        }
      } catch {
        // Proceed as unauthenticated guest preview
      }
    }

    const result = await this.couponsService.validateAndCalculateDiscount(
      dto.code,
      dto.subtotal,
      userId,
    );

    return {
      valid: true,
      code: result.coupon.code,
      description: result.coupon.description,
      discountType: result.coupon.discountType,
      discountValue: Number(result.coupon.discountValue),
      minOrderAmount:
        result.coupon.minOrderAmount !== null
          ? Number(result.coupon.minOrderAmount)
          : null,
      maxDiscountAmount:
        result.coupon.maxDiscountAmount !== null
          ? Number(result.coupon.maxDiscountAmount)
          : null,
      discountAmount: result.discountAmount,
    };
  }
}
