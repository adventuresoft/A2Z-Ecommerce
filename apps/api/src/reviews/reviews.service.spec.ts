import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { ReviewStatus, OrderStatus } from '@prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      product: {
        findUnique: vi.fn(),
      },
      order: {
        findFirst: vi.fn(),
      },
      review: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    service = new ReviewsService(prismaMock);
  });

  describe('createReview', () => {
    it('should throw NotFoundException if target product does not exist', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview('user-1', {
          productId: 'non-existent',
          rating: 5,
          comment: 'Great product!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a review with verified purchase flag when customer ordered the product', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        title: 'Noise Canceling Headphones',
        slug: 'headphones',
        isActive: true,
      });

      prismaMock.order.findFirst.mockResolvedValue({
        id: 'order-1',
      });

      prismaMock.review.findFirst.mockResolvedValue(null);

      prismaMock.review.create.mockResolvedValue({
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'user-1',
        orderId: 'order-1',
        rating: 5,
        title: 'Love it',
        comment: 'Great sound quality',
        isVerifiedPurchase: true,
        status: ReviewStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: { id: 'prod-1', title: 'Noise Canceling Headphones', slug: 'headphones', thumbnailUrl: null },
        user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        order: { id: 'order-1', orderNumber: 'AZ-001' },
      });

      const result = await service.createReview('user-1', {
        productId: 'prod-1',
        rating: 5,
        title: 'Love it',
        comment: 'Great sound quality',
      });

      expect(result.id).toBe('rev-1');
      expect(result.isVerifiedPurchase).toBe(true);
      expect(result.status).toBe(ReviewStatus.PENDING);
    });
  });

  describe('updateReviewStatus', () => {
    it('should moderate review status to APPROVED', async () => {
      prismaMock.review.findUnique.mockResolvedValue({ id: 'rev-1' });
      prismaMock.review.update.mockResolvedValue({
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great sound quality',
        isVerifiedPurchase: true,
        status: ReviewStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateReviewStatus('rev-1', {
        status: ReviewStatus.APPROVED,
      });

      expect(result.status).toBe(ReviewStatus.APPROVED);
    });
  });

  describe('getReviewStats', () => {
    it('should compute review count metrics and averages', async () => {
      prismaMock.review.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(35) // approved
        .mockResolvedValueOnce(5)  // rejected
        .mockResolvedValueOnce(30) // verified
        .mockResolvedValueOnce(2)  // star1
        .mockResolvedValueOnce(3)  // star2
        .mockResolvedValueOnce(5)  // star3
        .mockResolvedValueOnce(15) // star4
        .mockResolvedValueOnce(25); // star5

      prismaMock.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const stats = await service.getReviewStats();

      expect(stats.totalReviews).toBe(50);
      expect(stats.pendingCount).toBe(10);
      expect(stats.approvedCount).toBe(35);
      expect(stats.averageRating).toBe(4.5);
      expect(stats.ratingDistribution.star5).toBe(25);
    });
  });
});
