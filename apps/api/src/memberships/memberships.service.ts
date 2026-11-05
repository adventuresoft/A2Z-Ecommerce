import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaystationService } from '../payments/paystation.service.js';
import {
  CreateMembershipCheckoutDto,
  CreateMembershipPlanDto,
  MembershipCallbackQueryDto,
  UpdateMembershipPlanDto,
} from './dto/membership.dto.js';
import {
  MembershipPaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paystationService: PaystationService,
  ) {}

  /**
   * List all active plans for public storefront
   */
  async getPlans() {
    return this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * List all plans for admin
   */
  async getAllPlansAdmin() {
    return this.prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException(`Membership plan with ID "${id}" not found`);
    }
    return plan;
  }

  async createPlan(dto: CreateMembershipPlanDto) {
    return this.prisma.membershipPlan.create({
      data: {
        name: dto.name,
        durationDays: dto.durationDays,
        price: dto.price,
        features: dto.features ?? {},
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updatePlan(id: string, dto: UpdateMembershipPlanDto) {
    await this.getPlanById(id);
    return this.prisma.membershipPlan.update({
      where: { id },
      data: dto,
    });
  }

  async deletePlan(id: string) {
    await this.getPlanById(id);
    return this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Returns active subscription for a user if exists, along with days left
   */
  async getUserMembership(userId: string) {
    const now = new Date();
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        startsAt: { lte: now },
        expiresAt: { gt: now },
      },
      include: {
        plan: true,
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (!activeSub) {
      return {
        isActive: false,
        subscription: null,
        daysRemaining: 0,
      };
    }

    const diffMs = activeSub.expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      isActive: true,
      subscription: activeSub,
      daysRemaining,
    };
  }

  /**
   * Checks if user has an active, valid membership subscription right now
   */
  async checkUserAccess(userId: string): Promise<boolean> {
    const now = new Date();
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        startsAt: { lte: now },
        expiresAt: { gt: now },
      },
    });
    return !!sub;
  }

  /**
   * Returns subscription & payment history for the user
   */
  async getUserHistory(userId: string) {
    const [subscriptions, payments] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membershipPayment.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { subscriptions, payments };
  }

  /**
   * Initiates membership checkout with PayStation (or sandbox fallback)
   */
  async initiateCheckout(userId: string, dto: CreateMembershipCheckoutDto) {
    const plan = await this.getPlanById(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('This membership plan is currently inactive');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const idempotencyKey = randomUUID();
    const invoiceNumber = `MEM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.prisma.membershipPayment.create({
      data: {
        userId,
        planId: plan.id,
        amount: plan.price,
        gateway: 'PAYSTATION',
        idempotencyKey,
        status: MembershipPaymentStatus.PENDING,
        rawPayload: {
          invoiceNumber,
          planName: plan.name,
          customerPhone: user.phone,
          customerEmail: user.email,
        },
      },
    });

    const webBaseUrl =
      process.env.STORE_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';
    const callbackUrl = `${webBaseUrl}/membership/callback?paymentId=${payment.id}`;

    let paymentUrl = '';
    try {
      const charge = await this.paystationService.createCustomCharge({
        invoiceNumber,
        amount: plan.price,
        reference: payment.id,
        customerName: user.name || 'A2Z Member',
        customerPhone: user.phone || '01712345678',
        customerEmail: user.email || undefined,
        callbackUrl,
        checkoutItems: `Membership - ${plan.name}`,
      });
      paymentUrl = charge.payment_url;
      this.logger.log(
        `Generated PayStation Online Gateway checkout URL for payment ${payment.id}: ${paymentUrl}`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to generate PayStation hosted link: ${err?.message}. Falling back to sandbox callback simulator.`,
      );
      paymentUrl = `${callbackUrl}&status=Success&invoice_number=${invoiceNumber}&trx_id=PS-TXN-${randomUUID().slice(0, 8).toUpperCase()}`;
    }

    return {
      paymentId: payment.id,
      amount: plan.price,
      invoiceNumber,
      paymentUrl,
    };
  }

  /**
   * Idempotent payment callback handler
   */
  async handleCallback(query: MembershipCallbackQueryDto, paymentId: string) {
    const payment = await this.prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: { plan: true, user: true },
    });

    if (!payment) {
      throw new NotFoundException(`Membership payment "${paymentId}" not found`);
    }

    // If already processed, return current subscription status idempotently
    if (payment.status === MembershipPaymentStatus.PAID) {
      const existingSub = await this.prisma.subscription.findUnique({
        where: { paymentId: payment.id },
        include: { plan: true },
      });
      return {
        success: true,
        message: 'Payment already processed',
        subscription: existingSub,
      };
    }

    const isSuccess =
      query.status?.toLowerCase() === 'success' ||
      query.status?.toLowerCase() === 'paid' ||
      query.status?.toLowerCase() === 'completed';

    if (!isSuccess) {
      await this.prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: MembershipPaymentStatus.FAILED,
          rawPayload: { ...(payment.rawPayload as any), callbackError: query },
        },
      });
      return {
        success: false,
        message: 'Payment failed or cancelled at gateway',
      };
    }

    const now = new Date();
    let gatewayTxnId = query.trx_id;
    if (query.invoice_number) {
      try {
        const details = await this.paystationService.getTransactionDetails(query.invoice_number);
        if (details?.data?.trx_id) {
          gatewayTxnId = details.data.trx_id;
        }
      } catch {
        // Fall back to query.trx_id
      }
    }
    if (!gatewayTxnId) {
      gatewayTxnId = `TXN-${randomUUID().slice(0, 8)}`;
    }

    // Check for existing active subscription to stack renewal duration
    const latestActiveSub = await this.prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
    });

    const startsAt = latestActiveSub ? new Date(latestActiveSub.expiresAt) : now;
    const expiresAt = new Date(startsAt.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000);

    const [updatedPayment, subscription] = await this.prisma.$transaction([
      this.prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: MembershipPaymentStatus.PAID,
          gatewayTxnId,
          paidAt: now,
          rawPayload: { ...(payment.rawPayload as any), callbackResult: query },
        },
      }),
      this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          paymentId: payment.id,
          startsAt,
          expiresAt,
          status: SubscriptionStatus.ACTIVE,
        },
        include: { plan: true },
      }),
    ]);

    this.logger.log(
      `User ${payment.userId} activated membership "${payment.plan.name}" until ${expiresAt.toISOString()}`,
    );

    return {
      success: true,
      message: 'Membership activated successfully',
      subscription,
      payment: updatedPayment,
    };
  }

  // Admin listing & manual refund
  async listSubscriptions(query: { status?: SubscriptionStatus; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: {
          plan: true,
          user: {
            select: { id: true, name: true, phone: true, email: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit };
  }

  async listPayments(query: { status?: MembershipPaymentStatus; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [total, items] = await Promise.all([
      this.prisma.membershipPayment.count({ where }),
      this.prisma.membershipPayment.findMany({
        where,
        include: {
          plan: true,
          user: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit };
  }

  async refundPayment(paymentId: string, adminId: string) {
    const payment = await this.prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== MembershipPaymentStatus.PAID) {
      throw new BadRequestException('Only PAID payments can be refunded');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: MembershipPaymentStatus.REFUNDED,
          refundedById: adminId,
        },
      });

      if (payment.subscription) {
        await tx.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledReason: `Refunded by admin #${adminId}`,
          },
        });
      }

      return updated;
    });
  }
}

