import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FreelancerReviewStatus,
  FreelancerStatus,
  ReviewReportStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  AdminResolveReportDto,
  CreateFreelancerReviewDto,
  FreelancerReplyDto,
  FreelancerReviewQueryDto,
  ReportFreelancerReviewDto,
  UpdateFreelancerReviewDto,
} from './dto/freelancer-reviews.dto.js';

@Injectable()
export class FreelancerReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
  ) {}

  /**
   * Recalculates and updates cached averageRating and totalReviews on FreelancerProfile atomically.
   */
  private async recalculateFreelancerStats(
    tx: any,
    freelancerId: string,
  ): Promise<{ averageRating: number | null; totalReviews: number }> {
    const stats = await tx.freelancerReview.aggregate({
      where: {
        freelancerId,
        status: FreelancerReviewStatus.APPROVED,
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating =
      stats._avg.rating !== null
        ? Number(stats._avg.rating.toFixed(2))
        : null;
    const totalReviews = stats._count.id;

    await tx.freelancerProfile.update({
      where: { id: freelancerId },
      data: {
        averageRating,
        totalReviews,
      },
    });

    return { averageRating, totalReviews };
  }

  /**
   * Public list of approved reviews for a freelancer with pagination and summary breakdown.
   */
  async listReviews(freelancerId: string, query: FreelancerReviewQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const [total, rows, breakdown] = await Promise.all([
      this.prisma.freelancerReview.count({
        where: {
          freelancerId,
          status: FreelancerReviewStatus.APPROVED,
        },
      }),
      this.prisma.freelancerReview.findMany({
        where: {
          freelancerId,
          status: FreelancerReviewStatus.APPROVED,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          images: true,
          freelancerReply: true,
          repliedAt: true,
          isVerifiedContact: true,
          editCount: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.freelancerReview.groupBy({
        by: ['rating'],
        where: {
          freelancerId,
          status: FreelancerReviewStatus.APPROVED,
        },
        _count: { id: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const b of breakdown) {
      if (b.rating >= 1 && b.rating <= 5) {
        distribution[b.rating] = b._count.id;
      }
    }

    const freelancer = await this.prisma.freelancerProfile.findUnique({
      where: { id: freelancerId },
      select: { averageRating: true, totalReviews: true },
    });

    return {
      reviews: rows,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      limit,
      summary: {
        averageRating: freelancer?.averageRating
          ? Number(freelancer.averageRating)
          : null,
        totalReviews: freelancer?.totalReviews ?? total,
        distribution,
      },
    };
  }

  /**
   * Retrieves the current user's existing review for this freelancer, if any.
   */
  async getMyReview(freelancerId: string, clientId: string) {
    const review = await this.prisma.freelancerReview.findUnique({
      where: {
        freelancerId_clientId: { freelancerId, clientId },
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        images: true,
        freelancerReply: true,
        repliedAt: true,
        editCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      review,
      canEdit: review ? review.editCount === 0 : false,
      editCount: review?.editCount ?? 0,
    };
  }

  /**
   * Submits a new review.
   * Enforces verified contact rule and unique client review constraint.
   */
  async createReview(
    freelancerId: string,
    clientId: string,
    dto: CreateFreelancerReviewDto,
  ) {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { id: freelancerId },
      select: { id: true, userId: true, status: true },
    });

    if (!profile || profile.status !== FreelancerStatus.APPROVED) {
      throw new NotFoundException('Professional profile not found or not approved');
    }

    if (profile.userId === clientId) {
      throw new BadRequestException('You cannot review your own professional profile');
    }

    // Verified contact check: client must have revealed phone OR messaged
    const [reveal, conversation] = await Promise.all([
      this.prisma.contactReveal.findFirst({
        where: { userId: clientId, freelancerId },
        select: { id: true },
      }),
      this.prisma.conversation.findUnique({
        where: {
          clientId_freelancerId: { clientId, freelancerId },
        },
        select: { id: true },
      }),
    ]);

    if (!reveal && !conversation) {
      throw new ForbiddenException(
        'You can only review professionals you have contacted (revealed phone number or messaged).',
      );
    }

    // Unique review check
    const existing = await this.prisma.freelancerReview.findUnique({
      where: {
        freelancerId_clientId: { freelancerId, clientId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already submitted a review for this professional. You may edit your existing review.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.freelancerReview.create({
        data: {
          freelancerId,
          clientId,
          rating: dto.rating,
          comment: dto.comment.trim(),
          images: dto.images ?? [],
          isVerifiedContact: true,
          editCount: 0,
          status: FreelancerReviewStatus.APPROVED,
        },
      });

      const stats = await this.recalculateFreelancerStats(tx, freelancerId);

      return {
        ...review,
        stats,
      };
    });
  }

  /**
   * Updates an existing review.
   * Strict user rule: Client can edit at most ONCE after initial submission.
   */
  async updateReview(
    freelancerId: string,
    clientId: string,
    dto: UpdateFreelancerReviewDto,
  ) {
    const existing = await this.prisma.freelancerReview.findUnique({
      where: {
        freelancerId_clientId: { freelancerId, clientId },
      },
    });

    if (!existing) {
      throw new NotFoundException('You have not reviewed this professional yet');
    }

    if (existing.editCount >= 1) {
      throw new BadRequestException(
        'You have already edited your review once. Reviews can only be edited once after submission.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.freelancerReview.update({
        where: { id: existing.id },
        data: {
          ...(dto.rating !== undefined && { rating: dto.rating }),
          ...(dto.comment !== undefined && { comment: dto.comment.trim() }),
          ...(dto.images !== undefined && { images: dto.images }),
          editCount: { increment: 1 },
        },
      });

      const stats = await this.recalculateFreelancerStats(tx, freelancerId);

      return {
        ...updated,
        stats,
      };
    });
  }

  /**
   * Allows the reviewed freelancer to post a single public response.
   */
  async replyToReview(reviewId: string, userId: string, dto: FreelancerReplyDto) {
    const review = await this.prisma.freelancerReview.findUnique({
      where: { id: reviewId },
      include: {
        freelancer: { select: { id: true, userId: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.freelancer.userId !== userId) {
      throw new ForbiddenException('Only the reviewed professional can reply to this review');
    }

    if (review.freelancerReply) {
      throw new BadRequestException(
        'You have already replied to this review. Only one reply is allowed.',
      );
    }

    return this.prisma.freelancerReview.update({
      where: { id: reviewId },
      data: {
        freelancerReply: dto.reply.trim(),
        repliedAt: new Date(),
      },
    });
  }

  /**
   * Allows a freelancer to dispute/report an abusive review.
   */
  async reportReview(reviewId: string, userId: string, dto: ReportFreelancerReviewDto) {
    const review = await this.prisma.freelancerReview.findUnique({
      where: { id: reviewId },
      include: {
        freelancer: { select: { id: true, userId: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.freelancer.userId !== userId) {
      throw new ForbiddenException('Only the reviewed professional can report this review');
    }

    const existingReport = await this.prisma.freelancerReviewReport.findFirst({
      where: {
        reviewId,
        reporterId: userId,
        status: ReviewReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new ConflictException('You have already reported this review.');
    }

    return this.prisma.freelancerReviewReport.create({
      data: {
        reviewId,
        reporterId: userId,
        reason: dto.reason.trim(),
        status: ReviewReportStatus.PENDING,
      },
    });
  }

  // --- Admin Moderation ---

  async listReports(page = 1, limit = 20) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, reports] = await Promise.all([
      this.prisma.freelancerReviewReport.count(),
      this.prisma.freelancerReviewReport.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, name: true, phone: true } },
          review: {
            include: {
              client: { select: { id: true, name: true } },
              freelancer: { select: { id: true, displayName: true } },
            },
          },
        },
      }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async resolveReport(reportId: string, adminId: string, dto: AdminResolveReportDto) {
    const report = await this.prisma.freelancerReviewReport.findUnique({
      where: { id: reportId },
      include: { review: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.action === 'HIDE_REVIEW') {
        await tx.freelancerReview.update({
          where: { id: report.reviewId },
          data: { status: FreelancerReviewStatus.HIDDEN },
        });

        await this.recalculateFreelancerStats(tx, report.review.freelancerId);
      }

      const updatedReport = await tx.freelancerReviewReport.update({
        where: { id: reportId },
        data: {
          status:
            dto.action === 'HIDE_REVIEW'
              ? ReviewReportStatus.RESOLVED
              : ReviewReportStatus.DISMISSED,
          reviewedById: adminId,
        },
      });

      return updatedReport;
    });
  }
}

