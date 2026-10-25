import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SyncWishlistDto,
  WishlistItemResponseDto,
} from './dto/index.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all wishlisted products for the authenticated customer,
   * ordered by most recently saved first.
   */
  async getCustomerWishlist(userId: string): Promise<WishlistItemResponseDto[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            brand: {
              select: { id: true, name: true, slug: true },
            },
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
              take: 1,
            },
            variants: {
              orderBy: { regularPrice: 'asc' },
              include: {
                inventory: true,
              },
            },
            reviews: {
              where: { status: ReviewStatus.APPROVED },
              select: { rating: true },
            },
          },
        },
      },
    });

    return items.map((item) => this.formatWishlistItem(item));
  }

  /**
   * Adds a product (by UUID or slug) to the customer's wishlist idempotently.
   */
  async addProduct(
    userId: string,
    productIdOrSlug: string,
  ): Promise<WishlistItemResponseDto> {
    const resolvedProductId = await this.resolveProductId(productIdOrSlug);
    if (!resolvedProductId) {
      throw new NotFoundException(
        `Product "${productIdOrSlug}" was not found.`,
      );
    }

    await this.prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: resolvedProductId,
        },
      },
      update: {},
      create: {
        userId,
        productId: resolvedProductId,
      },
    });

    const item = await this.prisma.wishlistItem.findUniqueOrThrow({
      where: {
        userId_productId: {
          userId,
          productId: resolvedProductId,
        },
      },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            brand: {
              select: { id: true, name: true, slug: true },
            },
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
              take: 1,
            },
            variants: {
              orderBy: { regularPrice: 'asc' },
              include: {
                inventory: true,
              },
            },
            reviews: {
              where: { status: ReviewStatus.APPROVED },
              select: { rating: true },
            },
          },
        },
      },
    });

    return this.formatWishlistItem(item);
  }

  /**
   * Removes a product (by UUID or slug) from the customer's wishlist idempotently.
   */
  async removeProduct(
    userId: string,
    productIdOrSlug: string,
  ): Promise<{ success: boolean; removedProductId: string }> {
    const resolvedProductId =
      (await this.resolveProductId(productIdOrSlug)) || productIdOrSlug;

    await this.prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId: resolvedProductId,
      },
    });

    return {
      success: true,
      removedProductId: resolvedProductId,
    };
  }

  /**
   * Merges an array of guest localStorage product IDs or slugs into the customer's
   * database wishlist upon login/registration, ignoring invalid or mock IDs cleanly,
   * and returns the updated wishlist.
   */
  async syncGuestWishlist(
    userId: string,
    dto: SyncWishlistDto,
  ): Promise<WishlistItemResponseDto[]> {
    const rawIds = Array.from(
      new Set(
        (dto.productIds || [])
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean),
      ),
    );

    if (rawIds.length > 0) {
      const uuids = rawIds.filter((id) => UUID_REGEX.test(id));
      const slugs = rawIds.filter((id) => !UUID_REGEX.test(id));

      const orConditions: any[] = [];
      if (uuids.length > 0) {
        orConditions.push({ id: { in: uuids } });
      }
      if (slugs.length > 0) {
        orConditions.push({ slug: { in: slugs } });
      }

      if (orConditions.length > 0) {
        const matchedProducts = await this.prisma.product.findMany({
          where: { OR: orConditions },
          select: { id: true },
        });

        if (matchedProducts.length > 0) {
          await this.prisma.wishlistItem.createMany({
            data: matchedProducts.map((p) => ({
              userId,
              productId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    return this.getCustomerWishlist(userId);
  }

  /**
   * Resolves product summaries for unauthenticated guest wishlist IDs/slugs.
   */
  async getGuestWishlistProducts(
    dto: SyncWishlistDto,
  ): Promise<WishlistItemResponseDto[]> {
    const rawIds = Array.from(
      new Set(
        (dto.productIds || [])
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean),
      ),
    );

    if (rawIds.length === 0) {
      return [];
    }

    const uuids = rawIds.filter((id) => UUID_REGEX.test(id));
    const slugs = rawIds.filter((id) => !UUID_REGEX.test(id));

    const orConditions: any[] = [];
    if (uuids.length > 0) {
      orConditions.push({ id: { in: uuids } });
    }
    if (slugs.length > 0) {
      orConditions.push({ slug: { in: slugs } });
    }

    if (orConditions.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: { OR: orConditions },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
        variants: {
          orderBy: { regularPrice: 'asc' },
          include: {
            inventory: true,
          },
        },
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    });

    const now = new Date();
    return products.map((product) =>
      this.formatWishlistItem({
        id: `guest-${product.id}`,
        productId: product.id,
        createdAt: now,
        product,
      }),
    );
  }

  private async resolveProductId(productIdOrSlug: string): Promise<string | null> {
    const clean = productIdOrSlug.trim();
    if (!clean) return null;

    if (UUID_REGEX.test(clean)) {
      const byId = await this.prisma.product.findUnique({
        where: { id: clean },
        select: { id: true },
      });
      if (byId) return byId.id;
    }

    const bySlug = await this.prisma.product.findUnique({
      where: { slug: clean },
      select: { id: true },
    });

    return bySlug ? bySlug.id : null;
  }

  private formatWishlistItem(item: any): WishlistItemResponseDto {
    const p = item.product;
    const activeVariants = (p.variants || []).filter((v: any) => v.isActive);
    const primaryVariant = activeVariants[0] || p.variants?.[0] || null;

    const regularPrice = primaryVariant ? Number(primaryVariant.regularPrice) : 0;
    const salePrice =
      primaryVariant && primaryVariant.salePrice !== null
        ? Number(primaryVariant.salePrice)
        : null;
    const effectivePrice =
      salePrice !== null && salePrice > 0 && salePrice < regularPrice
        ? salePrice
        : regularPrice;

    const discountPercent =
      salePrice !== null && regularPrice > 0 && salePrice < regularPrice
        ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
        : null;

    let totalAvailableQty = 0;
    for (const v of activeVariants) {
      if (v.inventory) {
        const avail = Math.max(
          0,
          Number(v.inventory.quantity) - Number(v.inventory.reservedQuantity),
        );
        totalAvailableQty += avail;
      }
    }

    // Prefer an in-stock active variant as defaultVariantId when moving to cart
    const inStockVariant = activeVariants.find(
      (v: any) =>
        v.inventory &&
        Number(v.inventory.quantity) - Number(v.inventory.reservedQuantity) > 0,
    );
    const chosenVariant = inStockVariant || primaryVariant;

    const isUnavailable = !p.isActive || activeVariants.length === 0;
    const inStock = !isUnavailable && totalAvailableQty > 0;

    const reviews = p.reviews || [];
    const reviewsCount = reviews.length;
    const rating =
      reviewsCount > 0
        ? Number(
            (
              reviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0) /
              reviewsCount
            ).toFixed(1),
          )
        : 4.8;

    const imageUrl =
      p.images?.[0]?.imageUrl ||
      p.thumbnailUrl ||
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80';

    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isUnavailable,
        categoryName: p.category?.name || 'General',
        categorySlug: p.category?.slug || 'general',
        brandName: p.brand?.name || null,
        imageUrl,
        defaultVariantId: chosenVariant?.id || null,
        sku: chosenVariant?.sku || null,
        regularPrice,
        salePrice,
        effectivePrice,
        discountPercent,
        inStock,
        availableQuantity: totalAvailableQty,
        rating,
        reviewsCount,
      },
    };
  }
}
