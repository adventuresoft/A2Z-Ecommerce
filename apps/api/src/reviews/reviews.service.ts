import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReviewStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import {
  CreateReviewDto,
  PaginatedReviewsResponseDto,
  QueryReviewsDto,
  ReviewResponseDto,
  ReviewStatsResponseDto,
  UpdateReviewStatusDto,
} from './dto/index.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit or update a customer review for a product.
   * Automatically validates verified purchase eligibility if customer bought this product.
   */
  async createReview(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, title: true, slug: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${dto.productId}' not found`);
    }

    // Check if customer purchased this product in a confirmed or delivered order
    let isVerifiedPurchase = false;
    let linkedOrderId: string | null = dto.orderId || null;

    if (linkedOrderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: linkedOrderId,
          userId,
          orderStatus: {
            in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED],
          },
          items: {
            some: {
              variant: {
                productId: dto.productId,
              },
            },
          },
        },
        select: { id: true },
      });

      if (order) {
        isVerifiedPurchase = true;
      }
    } else {
      // Auto-detect if customer bought this product previously
      const verifiedOrder = await this.prisma.order.findFirst({
        where: {
          userId,
          orderStatus: {
            in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED],
          },
          items: {
            some: {
              variant: {
                productId: dto.productId,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (verifiedOrder) {
        isVerifiedPurchase = true;
        linkedOrderId = verifiedOrder.id;
      }
    }

    // Check if user already reviewed this product
    const existing = await this.prisma.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
      },
    });

    let review;
    if (existing) {
      review = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          title: dto.title ?? null,
          comment: dto.comment,
          orderId: linkedOrderId,
          isVerifiedPurchase: isVerifiedPurchase || existing.isVerifiedPurchase,
          status: ReviewStatus.PENDING, // requires re-moderation on edit
        },
        include: {
          product: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
      });
    } else {
      review = await this.prisma.review.create({
        data: {
          productId: dto.productId,
          userId,
          orderId: linkedOrderId,
          rating: dto.rating,
          title: dto.title ?? null,
          comment: dto.comment,
          isVerifiedPurchase,
          status: ReviewStatus.PENDING,
        },
        include: {
          product: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
      });
    }

    return this.mapReviewResponse(review);
  }

  /**
   * Administrative query with search, multi-axis filters, and pagination.
   */
  async getAdminReviews(
    query: QueryReviewsDto,
  ): Promise<PaginatedReviewsResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.rating) {
      where.rating = query.rating;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.isVerifiedPurchase !== undefined) {
      where.isVerifiedPurchase = query.isVerifiedPurchase;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { comment: { contains: term, mode: 'insensitive' } },
        { product: { title: { contains: term, mode: 'insensitive' } } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (query.sortBy === 'rating') {
      orderBy.rating = query.sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = query.sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          product: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapReviewResponse(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve single review detail by ID.
   */
  async getAdminReviewById(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, title: true, slug: true, thumbnailUrl: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${id}' not found`);
    }

    return this.mapReviewResponse(review);
  }

  /**
   * Aggregate statistics, ratings breakdown, and moderation queue metrics.
   */
  async getReviewStats(): Promise<ReviewStatsResponseDto> {
    const [
      totalReviews,
      pendingCount,
      approvedCount,
      rejectedCount,
      verifiedCount,
      star1Count,
      star2Count,
      star3Count,
      star4Count,
      star5Count,
      ratingAvg,
    ] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      this.prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
      this.prisma.review.count({ where: { status: ReviewStatus.REJECTED } }),
      this.prisma.review.count({ where: { isVerifiedPurchase: true } }),
      this.prisma.review.count({ where: { rating: 1 } }),
      this.prisma.review.count({ where: { rating: 2 } }),
      this.prisma.review.count({ where: { rating: 3 } }),
      this.prisma.review.count({ where: { rating: 4 } }),
      this.prisma.review.count({ where: { rating: 5 } }),
      this.prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    const averageRating = ratingAvg._avg.rating
      ? Number(ratingAvg._avg.rating.toFixed(2))
      : 0;

    return {
      totalReviews,
      pendingCount,
      approvedCount,
      rejectedCount,
      verifiedPurchaseCount: verifiedCount,
      averageRating,
      ratingDistribution: {
        star1: star1Count,
        star2: star2Count,
        star3: star3Count,
        star4: star4Count,
        star5: star5Count,
      },
    };
  }

  /**
   * Moderate a review: approve or reject.
   */
  async updateReviewStatus(
    id: string,
    dto: UpdateReviewStatusDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${id}' not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        product: {
          select: { id: true, title: true, slug: true, thumbnailUrl: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    return this.mapReviewResponse(updated);
  }

  /**
   * Delete a review.
   */
  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with ID '${id}' not found`);
    }

    await this.prisma.review.delete({ where: { id } });
    return { success: true, message: 'Review deleted successfully' };
  }

  /**
   * Public storefront approved reviews query for a product.
   */
  async getProductApprovedReviews(
    productId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = {
      productId,
      status: ReviewStatus.APPROVED,
    };

    if (rating) {
      where.rating = rating;
    }

    const [items, total, avgRating] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where: { productId, status: ReviewStatus.APPROVED },
        _avg: { rating: true },
      }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        user: {
          name: r.user.name,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      averageRating: avgRating._avg.rating
        ? Number(avgRating._avg.rating.toFixed(2))
        : 0,
    };
  }

  private mapReviewResponse(review: any): ReviewResponseDto {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      product: review.product
        ? {
            id: review.product.id,
            title: review.product.title,
            slug: review.product.slug,
            thumbnailUrl: review.product.thumbnailUrl,
          }
        : undefined,
      user: review.user
        ? {
            id: review.user.id,
            name: review.user.name,
            email: review.user.email,
          }
        : undefined,
      order: review.order
        ? {
            id: review.order.id,
            orderNumber: review.order.orderNumber,
          }
        : null,
    };
  }
}
