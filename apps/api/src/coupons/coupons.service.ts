import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DiscountType, Prisma, type Coupon } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import {
  CouponComputedStatus,
  CouponQueryDto,
  CouponResponseDto,
  CouponStatsResponseDto,
  CreateCouponDto,
  PaginatedCouponResponseDto,
  UpdateCouponDto,
} from './dto/index.js';

export interface ValidatedCouponResult {
  coupon: Coupon;
  discountAmount: number;
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditLogsService?: AuditLogsService,
  ) {}

  /**
   * Computes the current lifecycle status of a coupon.
   */
  computeCouponStatus(
    coupon: {
      isActive: boolean;
      startDate: Date;
      endDate: Date;
      totalUsageLimit: number | null;
    },
    usagesCount: number,
  ): CouponComputedStatus {
    if (!coupon.isActive) {
      return 'INACTIVE';
    }
    if (
      coupon.totalUsageLimit !== null &&
      usagesCount >= coupon.totalUsageLimit
    ) {
      return 'EXHAUSTED';
    }
    const now = new Date();
    if (now < coupon.startDate) {
      return 'SCHEDULED';
    }
    if (now > coupon.endDate) {
      return 'EXPIRED';
    }
    return 'LIVE';
  }

  /**
   * Retrieves aggregate promotional coupon statistics for Admin KPI cards.
   */
  async getStats(): Promise<CouponStatsResponseDto> {
    const [coupons, usageAgg] = await Promise.all([
      this.prisma.coupon.findMany({
        select: {
          id: true,
          isActive: true,
          startDate: true,
          endDate: true,
          totalUsageLimit: true,
          _count: {
            select: { usages: true },
          },
        },
      }),
      this.prisma.couponUsage.aggregate({
        _count: { id: true },
        _sum: { discountApplied: true },
      }),
    ]);

    let liveCoupons = 0;
    let scheduledCoupons = 0;
    let expiredOrExhaustedCoupons = 0;

    for (const c of coupons) {
      const status = this.computeCouponStatus(c, c._count.usages);
      if (status === 'LIVE') {
        liveCoupons++;
      } else if (status === 'SCHEDULED') {
        scheduledCoupons++;
      } else if (status === 'EXPIRED' || status === 'EXHAUSTED') {
        expiredOrExhaustedCoupons++;
      }
    }

    return {
      totalCoupons: coupons.length,
      liveCoupons,
      scheduledCoupons,
      expiredOrExhaustedCoupons,
      totalRedemptions: usageAgg._count.id || 0,
      totalDiscountGranted: Number(usageAgg._sum.discountApplied || 0),
    };
  }

  /**
   * Paginated administrative list of coupons with search, discountType, isActive, and computed status filters.
   */
  async findAllAdmin(
    query: CouponQueryDto,
  ): Promise<PaginatedCouponResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const where: Prisma.CouponWhereInput = {};

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.discountType) {
      where.discountType = query.discountType;
    }

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    const now = new Date();
    if (query.status === 'INACTIVE') {
      where.isActive = false;
    } else if (query.status === 'SCHEDULED') {
      where.isActive = true;
      where.startDate = { gt: now };
    } else if (query.status === 'EXPIRED') {
      where.isActive = true;
      where.endDate = { lt: now };
    } else if (query.status === 'LIVE') {
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const allMatching = await this.prisma.coupon.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { usages: true },
        },
        usages: {
          select: {
            discountApplied: true,
          },
        },
      },
    });

    // Apply post-query filter for EXHAUSTED or LIVE (checking usage cap vs totalUsageLimit)
    const filtered = allMatching.filter((item) => {
      const computedStatus = this.computeCouponStatus(item, item._count.usages);
      if (query.status) {
        return computedStatus === query.status;
      }
      return true;
    });

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const pagedItems = filtered.slice(skip, skip + limit);

    return {
      items: pagedItems.map((item) => this.formatCoupon(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single coupon by ID including its full redemption history.
   */
  async findOneAdmin(id: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 100,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                orderStatus: true,
                grandTotal: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" was not found.`);
    }

    return this.formatCoupon(coupon, true);
  }

  /**
   * Creates a new promotional coupon with strict financial and date validation.
   */
  async create(
    dto: CreateCouponDto,
    performedByUserId?: string,
  ): Promise<CouponResponseDto> {
    const cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      throw new BadRequestException('Coupon code cannot be empty.');
    }

    const existing = await this.prisma.coupon.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new ConflictException(`Coupon code "${cleanCode}" already exists.`);
    }

    this.validateCouponRules({
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    const created = await this.prisma.coupon.create({
      data: {
        code: cleanCode,
        description: dto.description?.trim() || null,
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        minOrderAmount:
          dto.minOrderAmount !== undefined && dto.minOrderAmount !== null
            ? new Prisma.Decimal(dto.minOrderAmount)
            : null,
        maxDiscountAmount:
          dto.maxDiscountAmount !== undefined && dto.maxDiscountAmount !== null
            ? new Prisma.Decimal(dto.maxDiscountAmount)
            : null,
        totalUsageLimit:
          dto.totalUsageLimit !== undefined && dto.totalUsageLimit !== null
            ? dto.totalUsageLimit
            : null,
        perCustomerLimit: dto.perCustomerLimit ?? 1,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: { select: { usages: true } },
        usages: { select: { discountApplied: true } },
      },
    });

    await this.auditLogsService?.log({
      userId: performedByUserId,
      action: 'COUPON_CREATE',
      entityType: 'Coupon',
      entityId: created.id,
      newValues: {
        code: created.code,
        discountType: created.discountType,
        discountValue: Number(created.discountValue),
        isActive: created.isActive,
      },
    });

    return this.formatCoupon(created);
  }

  /**
   * Updates an existing promotional coupon.
   */
  async update(
    id: string,
    dto: UpdateCouponDto,
    performedByUserId?: string,
  ): Promise<CouponResponseDto> {
    const current = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException(`Coupon with ID "${id}" was not found.`);
    }

    let cleanCode: string | undefined;
    if (dto.code !== undefined) {
      cleanCode = dto.code.trim().toUpperCase().replace(/\s+/g, '');
      if (!cleanCode) {
        throw new BadRequestException('Coupon code cannot be empty.');
      }
      if (cleanCode !== current.code) {
        const duplicate = await this.prisma.coupon.findUnique({
          where: { code: cleanCode },
        });
        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            `Coupon code "${cleanCode}" is already in use by another coupon.`,
          );
        }
      }
    }

    const effectiveDiscountType = dto.discountType ?? current.discountType;
    const effectiveDiscountValue =
      dto.discountValue !== undefined
        ? dto.discountValue
        : Number(current.discountValue);
    const effectiveStartDate = dto.startDate
      ? new Date(dto.startDate)
      : current.startDate;
    const effectiveEndDate = dto.endDate
      ? new Date(dto.endDate)
      : current.endDate;

    this.validateCouponRules({
      discountType: effectiveDiscountType,
      discountValue: effectiveDiscountValue,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    });

    const data: Prisma.CouponUpdateInput = {};
    if (cleanCode !== undefined) data.code = cleanCode;
    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) {
      data.discountValue = new Prisma.Decimal(dto.discountValue);
    }
    if (dto.minOrderAmount !== undefined) {
      data.minOrderAmount =
        dto.minOrderAmount !== null && dto.minOrderAmount > 0
          ? new Prisma.Decimal(dto.minOrderAmount)
          : null;
    }
    if (dto.maxDiscountAmount !== undefined) {
      data.maxDiscountAmount =
        dto.maxDiscountAmount !== null && dto.maxDiscountAmount > 0
          ? new Prisma.Decimal(dto.maxDiscountAmount)
          : null;
    }
    if (dto.totalUsageLimit !== undefined) {
      data.totalUsageLimit =
        dto.totalUsageLimit !== null && dto.totalUsageLimit > 0
          ? dto.totalUsageLimit
          : null;
    }
    if (dto.perCustomerLimit !== undefined) {
      data.perCustomerLimit = dto.perCustomerLimit;
    }
    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      data.endDate = new Date(dto.endDate);
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data,
      include: {
        _count: { select: { usages: true } },
        usages: { select: { discountApplied: true } },
      },
    });

    await this.auditLogsService?.log({
      userId: performedByUserId,
      action: 'COUPON_UPDATE',
      entityType: 'Coupon',
      entityId: updated.id,
      oldValues: {
        code: current.code,
        discountType: current.discountType,
        discountValue: Number(current.discountValue),
        isActive: current.isActive,
      },
      newValues: {
        code: updated.code,
        discountType: updated.discountType,
        discountValue: Number(updated.discountValue),
        isActive: updated.isActive,
      },
    });

    return this.formatCoupon(updated);
  }

  /**
   * Deletes an unused coupon or soft-deactivates a coupon that has historical order redemptions.
   */
  async remove(
    id: string,
    performedByUserId?: string,
  ): Promise<{ success: boolean; deactivated: boolean; message: string }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" was not found.`);
    }

    if (coupon._count.usages > 0) {
      await this.prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      await this.auditLogsService?.log({
        userId: performedByUserId,
        action: 'COUPON_DEACTIVATE',
        entityType: 'Coupon',
        entityId: coupon.id,
        oldValues: { code: coupon.code, isActive: coupon.isActive },
        newValues: { code: coupon.code, isActive: false },
      });

      return {
        success: true,
        deactivated: true,
        message: `Coupon "${coupon.code}" has ${coupon._count.usages} historical order redemption(s) and has been safely deactivated to preserve financial history.`,
      };
    }

    await this.prisma.coupon.delete({ where: { id } });

    await this.auditLogsService?.log({
      userId: performedByUserId,
      action: 'COUPON_DELETE',
      entityType: 'Coupon',
      entityId: coupon.id,
      oldValues: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
    });

    return {
      success: true,
      deactivated: false,
      message: `Coupon "${coupon.code}" permanently deleted.`,
    };
  }

  /**
   * Public endpoint helper returning currently active & valid promotional coupons.
   */
  async findActivePublic(): Promise<CouponResponseDto[]> {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { usages: true } },
        usages: { select: { discountApplied: true } },
      },
    });

    return coupons
      .filter(
        (c) =>
          c.totalUsageLimit === null || c._count.usages < c.totalUsageLimit,
      )
      .map((c) => this.formatCoupon(c));
  }

  /**
   * Validates a promotional coupon code and computes authoritative discount amount.
   */
  async validateAndCalculateDiscount(
    code: string,
    subtotal: number,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ValidatedCouponResult> {
    if (!code || !code.trim()) {
      throw new BadRequestException('Coupon code is required.');
    }

    const prismaClient = tx || this.prisma;
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prismaClient.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException(
        `Coupon '${cleanCode}' is invalid or no longer active.`,
      );
    }

    const now = new Date();
    if (now < coupon.startDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' is not active yet.`);
    }
    if (now > coupon.endDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' has expired.`);
    }

    if (coupon.minOrderAmount !== null) {
      const minAmount = Number(coupon.minOrderAmount);
      if (subtotal < minAmount) {
        throw new BadRequestException(
          `Minimum order amount of BDT ${minAmount.toLocaleString('en-US')} required for coupon '${cleanCode}'.`,
        );
      }
    }

    if (coupon.totalUsageLimit !== null) {
      const totalUsages = await prismaClient.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (totalUsages >= coupon.totalUsageLimit) {
        throw new BadRequestException(
          `Coupon '${cleanCode}' usage limit has been reached.`,
        );
      }
    }

    if (userId && coupon.perCustomerLimit > 0) {
      const userUsages = await prismaClient.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });
      if (userUsages >= coupon.perCustomerLimit) {
        throw new BadRequestException(
          `You have already reached the redemption limit (${coupon.perCustomerLimit}) for coupon '${cleanCode}'.`,
        );
      }
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount !== null) {
        discount = Math.min(discount, Number(coupon.maxDiscountAmount));
      }
    } else {
      discount = Math.min(Number(coupon.discountValue), subtotal);
    }

    const discountAmount = Math.max(0, Number(discount.toFixed(2)));

    return {
      coupon,
      discountAmount,
    };
  }

  /**
   * Records an immutable CouponUsage record within a database transaction upon order creation.
   */
  async recordUsage(
    couponId: string,
    orderId: string,
    userId: string,
    discountApplied: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.couponUsage.create({
      data: {
        couponId,
        orderId,
        userId,
        discountApplied: new Prisma.Decimal(discountApplied),
      },
    });
  }

  private validateCouponRules(params: {
    discountType: DiscountType;
    discountValue: number;
    startDate: Date;
    endDate: Date;
  }) {
    if (params.discountValue <= 0) {
      throw new BadRequestException('Discount value must be greater than 0.');
    }
    if (
      params.discountType === DiscountType.PERCENTAGE &&
      params.discountValue > 100
    ) {
      throw new BadRequestException(
        'Percentage discount value cannot exceed 100%.',
      );
    }
    if (
      isNaN(params.startDate.getTime()) ||
      isNaN(params.endDate.getTime())
    ) {
      throw new BadRequestException('Invalid start or end date format.');
    }
    if (params.endDate <= params.startDate) {
      throw new BadRequestException(
        'End date must be strictly after the start date.',
      );
    }
  }

  private formatCoupon(
    coupon: {
      id: string;
      code: string;
      description: string | null;
      discountType: DiscountType;
      discountValue: Prisma.Decimal | number;
      minOrderAmount: Prisma.Decimal | number | null;
      maxDiscountAmount: Prisma.Decimal | number | null;
      totalUsageLimit: number | null;
      perCustomerLimit: number;
      startDate: Date;
      endDate: Date;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      _count?: { usages: number };
      usages?: Array<{
        id?: string;
        orderId?: string;
        userId?: string;
        discountApplied: Prisma.Decimal | number;
        usedAt?: Date;
        user?: { id: string; name: string; email: string };
        order?: {
          id: string;
          orderNumber: string;
          orderStatus: any;
          grandTotal: Prisma.Decimal | number;
        };
      }>;
    },
    includeUsageDetails = false,
  ): CouponResponseDto {
    const usagesCount = coupon._count?.usages ?? coupon.usages?.length ?? 0;
    const totalDiscountGiven = Number(
      (coupon.usages || [])
        .reduce((acc, u) => acc + Number(u.discountApplied), 0)
        .toFixed(2),
    );

    const response: CouponResponseDto = {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount:
        coupon.minOrderAmount !== null ? Number(coupon.minOrderAmount) : null,
      maxDiscountAmount:
        coupon.maxDiscountAmount !== null
          ? Number(coupon.maxDiscountAmount)
          : null,
      totalUsageLimit: coupon.totalUsageLimit,
      perCustomerLimit: coupon.perCustomerLimit,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      isActive: coupon.isActive,
      usagesCount,
      totalDiscountGiven,
      computedStatus: this.computeCouponStatus(coupon, usagesCount),
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };

    if (includeUsageDetails && coupon.usages) {
      response.usages = coupon.usages
        .filter((u) => u.id && u.order && u.user)
        .map((u) => ({
          id: u.id!,
          orderId: u.orderId!,
          orderNumber: u.order!.orderNumber,
          orderStatus: u.order!.orderStatus,
          orderGrandTotal: Number(u.order!.grandTotal),
          userId: u.userId!,
          customerName: u.user!.name,
          customerEmail: u.user!.email,
          discountApplied: Number(u.discountApplied),
          usedAt: u.usedAt!,
        }));
    }

    return response;
  }
}
