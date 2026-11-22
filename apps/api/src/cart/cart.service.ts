import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AddCartItemDto,
  CartClearResponseDto,
  CartItemResponseDto,
  CartResponseDto,
  CartWarningDto,
  SyncCartDto,
  UpdateCartItemDto,
} from './dto/index.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private computeAvailableStock(inventory?: {
    quantity: number;
    reservedQuantity: number;
  } | null): number {
    if (!inventory) return 0;
    return Math.max(0, inventory.quantity - inventory.reservedQuantity);
  }

  private mapCartItem(record: any): CartItemResponseDto {
    const v = record.variant;
    const p = v.product;
    const regularPrice = Number(v.regularPrice);
    const salePrice = v.salePrice != null ? Number(v.salePrice) : null;
    const effectivePrice =
      salePrice != null && salePrice > 0 && salePrice < regularPrice
        ? salePrice
        : regularPrice;

    const availableQuantity = this.computeAvailableStock(v.inventory);
    const isActive = Boolean(v.isActive && p?.isActive);
    const inStock = isActive && availableQuantity > 0;
    const isUnavailable = !isActive || availableQuantity <= 0;

    const attrs: string[] = Array.isArray(v.attributes)
      ? v.attributes
          .map((a: any) => a?.attributeValue?.value)
          .filter((val: unknown): val is string => typeof val === 'string' && val.length > 0)
      : [];

    const imageUrl =
      v.imageUrl ||
      v.image?.url ||
      p?.thumbnailUrl ||
      (Array.isArray(p?.images) && p.images[0]?.url) ||
      null;

    return {
      id: record.id,
      variantId: record.variantId,
      productId: p.id,
      title: p.title,
      slug: p.slug,
      sku: v.sku,
      variantLabel: attrs.length > 0 ? attrs.join(' / ') : null,
      imageUrl,
      regularPrice,
      salePrice,
      effectivePrice,
      quantity: record.quantity,
      lineTotal: Number((effectivePrice * record.quantity).toFixed(2)),
      availableQuantity,
      inStock,
      isUnavailable,
      updatedAt: record.updatedAt,
    };
  }

  async getCart(
    userId: string,
    warnings?: CartWarningDto[],
  ): Promise<CartResponseDto> {
    const records = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        variant: {
          include: {
            inventory: true,
            image: true,
            attributes: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const items = records.map((r) => this.mapCartItem(r));
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );

    return {
      items,
      totalItems,
      subtotal,
      ...(warnings ? { warnings } : {}),
    };
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: {
        inventory: true,
        product: true,
      },
    });

    if (!variant || !variant.isActive || !variant.product?.isActive) {
      throw new NotFoundException('Product variant is unavailable or does not exist');
    }

    const available = this.computeAvailableStock(variant.inventory);
    if (available <= 0) {
      throw new BadRequestException('This product variant is currently out of stock');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_variantId: { userId, variantId: dto.variantId },
      },
    });

    const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;
    if (nextQuantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) available in stock for this variant`,
      );
    }

    await this.prisma.cartItem.upsert({
      where: {
        userId_variantId: { userId, variantId: dto.variantId },
      },
      create: {
        userId,
        variantId: dto.variantId,
        quantity: nextQuantity,
      },
      update: {
        quantity: nextQuantity,
      },
    });

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    variantId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    if (dto.quantity === 0) {
      await this.prisma.cartItem.deleteMany({
        where: { userId, variantId },
      });
      return this.getCart(userId);
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_variantId: { userId, variantId },
      },
      include: {
        variant: {
          include: {
            inventory: true,
            product: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Cart item not found');
    }

    const variant = existing.variant;
    if (!variant.isActive || !variant.product?.isActive) {
      throw new BadRequestException('This product variant is no longer available');
    }

    const available = this.computeAvailableStock(variant.inventory);
    if (dto.quantity > available) {
      throw new BadRequestException(
        `Only ${available} unit(s) available in stock for this variant`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, variantId: string): Promise<CartResponseDto> {
    await this.prisma.cartItem.deleteMany({
      where: { userId, variantId },
    });
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartClearResponseDto> {
    const result = await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
    return {
      success: true,
      removedCount: result.count,
    };
  }

  async syncCart(userId: string, dto: SyncCartDto): Promise<CartResponseDto> {
    const warnings: CartWarningDto[] = [];

    // Deduplicate incoming guest items by variantId
    const guestMap = new Map<string, number>();
    for (const item of dto.items || []) {
      if (!item.variantId || item.quantity <= 0) continue;
      guestMap.set(item.variantId, (guestMap.get(item.variantId) ?? 0) + item.quantity);
    }

    const variantIds = Array.from(guestMap.keys());
    if (variantIds.length === 0) {
      return this.getCart(userId, warnings);
    }

    const [variants, existingItems] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          inventory: true,
          product: true,
        },
      }),
      this.prisma.cartItem.findMany({
        where: { userId, variantId: { in: variantIds } },
      }),
    ]);

    const variantById = new Map(variants.map((v) => [v.id, v]));
    const existingByVariantId = new Map(existingItems.map((i) => [i.variantId, i]));

    await this.prisma.$transaction(async (tx) => {
      for (const [variantId, guestQty] of guestMap.entries()) {
        const variant = variantById.get(variantId);
        if (!variant || !variant.isActive || !variant.product?.isActive) {
          warnings.push({
            variantId,
            code: 'VARIANT_UNAVAILABLE',
            message: 'Item is no longer available and was skipped during cart sync.',
            requestedQuantity: guestQty,
            appliedQuantity: 0,
          });
          continue;
        }

        const available = this.computeAvailableStock(variant.inventory);
        if (available <= 0) {
          warnings.push({
            variantId,
            code: 'OUT_OF_STOCK',
            message: `${variant.product.title} is currently out of stock and was skipped.`,
            requestedQuantity: guestQty,
            appliedQuantity: 0,
          });
          continue;
        }

        const existingQty = existingByVariantId.get(variantId)?.quantity ?? 0;
        const requestedTotal = existingQty + guestQty;
        const appliedQuantity = Math.min(requestedTotal, available);

        if (appliedQuantity < requestedTotal) {
          warnings.push({
            variantId,
            code: 'QUANTITY_CAPPED',
            message: `${variant.product.title} quantity was adjusted to ${appliedQuantity} based on available stock.`,
            requestedQuantity: requestedTotal,
            appliedQuantity,
          });
        }

        await tx.cartItem.upsert({
          where: {
            userId_variantId: { userId, variantId },
          },
          create: {
            userId,
            variantId,
            quantity: appliedQuantity,
          },
          update: {
            quantity: appliedQuantity,
          },
        });
      }
    });

    return this.getCart(userId, warnings);
  }
}
