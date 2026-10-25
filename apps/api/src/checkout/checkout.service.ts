import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { TaxesService } from '../taxes/taxes.service.js';
import {
  CalculateCheckoutDto,
  CheckoutCalculationResponseDto,
  CheckoutCouponSummaryDto,
  CheckoutItemValidationDto,
  CheckoutShippingMethodSummaryDto,
} from './dto/index.js';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly taxesService: TaxesService,
  ) {}

  /**
   * Authoritatively calculates pre-checkout totals: subtotal, shipping fee, line VAT,
   * coupon discount, and validates warehouse inventory availability.
   */
  async calculateCheckout(
    dto: CalculateCheckoutDto,
    userId?: string,
  ): Promise<CheckoutCalculationResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Checkout requires at least one line item.');
    }

    // Consolidate duplicate variant IDs if any
    const itemMap = new Map<string, number>();
    for (const item of dto.items) {
      const current = itemMap.get(item.variantId) || 0;
      itemMap.set(item.variantId, current + item.quantity);
    }
    const variantIds = Array.from(itemMap.keys());

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: true,
        inventory: true,
      },
    });

    let subtotal = 0;
    let totalTaxAmount = 0;
    let isEligibleForCheckout = true;
    const itemsValidation: CheckoutItemValidationDto[] = [];

    for (const variantId of variantIds) {
      const qty = itemMap.get(variantId) || 1;
      const variant = variants.find((v) => v.id === variantId);

      if (!variant || !variant.isActive || !variant.product.isActive) {
        itemsValidation.push({
          variantId,
          productTitle: variant?.product?.title || 'Unknown Product',
          sku: variant?.sku || 'UNKNOWN',
          unitPrice: 0,
          quantity: qty,
          totalPrice: 0,
          availableQuantity: 0,
          isValid: false,
          errorMessage: 'This product variant is no longer available.',
        });
        isEligibleForCheckout = false;
        continue;
      }

      const unitPrice =
        variant.salePrice !== null ? Number(variant.salePrice) : Number(variant.regularPrice);
      const totalPrice = Number((unitPrice * qty).toFixed(2));
      subtotal += totalPrice;

      const availableStock = Math.max(
        0,
        (variant.inventory?.quantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0),
      );
      const hasStock = availableStock >= qty;

      if (!hasStock) {
        isEligibleForCheckout = false;
      }

      // Reverse-calculate VAT
      const taxResolution = await this.taxesService.resolveEffectiveTaxClass({
        productId: variant.productId,
        categoryId: variant.product.categoryId ?? undefined,
      });

      const lineTax = this.taxesService.calculateLineItemTax(
        unitPrice,
        qty,
        taxResolution.taxRate,
        taxResolution.taxClassName,
      );
      totalTaxAmount += lineTax.totalTax;

      itemsValidation.push({
        variantId,
        productTitle: variant.product.title,
        sku: variant.sku,
        unitPrice,
        quantity: qty,
        totalPrice,
        availableQuantity: availableStock,
        isValid: hasStock,
        errorMessage: hasStock ? undefined : `Requested ${qty} but only ${availableStock} in stock.`,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    totalTaxAmount = Number(totalTaxAmount.toFixed(2));

    // Shipping fee resolution
    let shippingFee = 60.0;
    let shippingMethod: CheckoutShippingMethodSummaryDto | null = null;

    if (subtotal >= 100000) {
      // Free delivery on high-value cart
      shippingFee = 0.0;
      shippingMethod = {
        id: 'free-shipping',
        name: 'Free Delivery (Privilege Club)',
        estimatedDays: 3,
        cost: 0.0,
      };
    } else if (dto.shippingMethodId) {
      const method = await this.prisma.shippingMethod.findUnique({
        where: { id: dto.shippingMethodId, isActive: true },
      });
      if (method) {
        shippingFee = Number(method.cost);
        shippingMethod = {
          id: method.id,
          name: method.name,
          estimatedDays: method.estimatedDays,
          cost: Number(method.cost),
        };
      }
    } else {
      const isDhaka =
        !dto.shippingCity || dto.shippingCity.trim().toLowerCase().includes('dhaka');
      shippingFee = isDhaka ? 60.0 : 120.0;
      shippingMethod = {
        id: isDhaka ? 'std-dhaka' : 'std-outside',
        name: isDhaka ? 'Standard Delivery (Inside Dhaka)' : 'Standard Delivery (Outside Dhaka)',
        estimatedDays: isDhaka ? 3 : 5,
        cost: shippingFee,
      };
    }

    // Coupon discount resolution
    let discountAmount = 0.0;
    let coupon: CheckoutCouponSummaryDto | null = null;

    if (dto.couponCode && dto.couponCode.trim()) {
      const couponResult = await this.couponsService.validateAndCalculateDiscount(
        dto.couponCode,
        subtotal,
        userId,
      );
      discountAmount = couponResult.discountAmount;
      coupon = {
        code: couponResult.coupon.code,
        discountType: couponResult.coupon.discountType,
        discountValue: Number(couponResult.coupon.discountValue),
        description: couponResult.coupon.description,
      };
    }

    const grandTotal = Math.max(0, Number((subtotal - discountAmount + shippingFee).toFixed(2)));

    return {
      subtotal,
      discountAmount,
      coupon,
      shippingFee,
      shippingMethod,
      totalTaxAmount,
      grandTotal,
      itemsValidation,
      isEligibleForCheckout,
    };
  }
}
