import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreatePaymentDto,
  CreateRefundDto,
  PaginatedPaymentsResponseDto,
  PaginatedRefundsResponseDto,
  PaymentResponseDto,
  PaymentStatsResponseDto,
  QueryPaymentsDto,
  QueryRefundsDto,
  RefundResponseDto,
  UpdatePaymentStatusDto,
  UpdateRefundStatusDto,
  UpdatePaymentMethodDto,
  TogglePaymentMethodDto,
  PaymentMethodResponseDto,
  ActivePaymentMethodDto,
} from './dto/index.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly paymentIncludes = {
    order: {
      include: {
        user: { select: { name: true, email: true } },
      },
    },
    refunds: {
      orderBy: { createdAt: 'desc' as const },
    },
  };

  private readonly refundIncludes = {
    order: {
      include: {
        user: { select: { name: true, email: true } },
      },
    },
    payment: true,
    processedByUser: {
      select: { id: true, name: true, email: true },
    },
  };

  /**
   * Helper to map Prisma Payment entity into typed PaymentResponseDto
   */
  private mapPayment(payment: any): PaymentResponseDto {
    const totalRefunded = (payment.refunds || [])
      .filter((r: any) => r.status === RefundStatus.COMPLETED)
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const mappedRefunds = (payment.refunds || []).map((r: any) => ({
      id: r.id,
      amount: Number(r.amount),
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt,
    }));

    return {
      id: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      transactionRef: payment.transactionRef || null,
      idempotencyKey: payment.idempotencyKey || null,
      notes: payment.notes || null,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      refundedAmount: totalRefunded,
      refunds: mappedRefunds,
      order: payment.order
        ? {
            id: payment.order.id,
            orderNumber: payment.order.orderNumber,
            grandTotal: Number(payment.order.grandTotal),
            orderStatus: payment.order.orderStatus,
            paymentStatus: payment.order.paymentStatus,
            recipientName: payment.order.recipientName,
            recipientPhone: payment.order.recipientPhone,
            customerName: payment.order.user?.name || undefined,
            customerEmail: payment.order.user?.email || undefined,
          }
        : undefined,
    };
  }

  /**
   * Helper to map Prisma Refund entity into typed RefundResponseDto
   */
  private mapRefund(refund: any): RefundResponseDto {
    return {
      id: refund.id,
      orderId: refund.orderId,
      paymentId: refund.paymentId,
      amount: Number(refund.amount),
      reason: refund.reason,
      status: refund.status,
      refundMethod: refund.refundMethod || null,
      transactionRef: refund.transactionRef || null,
      notes: refund.notes || null,
      processedByUserId: refund.processedByUserId || null,
      processedByUserName: refund.processedByUser?.name || null,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
      order: refund.order
        ? {
            id: refund.order.id,
            orderNumber: refund.order.orderNumber,
            grandTotal: Number(refund.order.grandTotal),
            orderStatus: refund.order.orderStatus,
            paymentStatus: refund.order.paymentStatus,
            recipientName: refund.order.recipientName,
            recipientPhone: refund.order.recipientPhone,
            customerName: refund.order.user?.name || undefined,
            customerEmail: refund.order.user?.email || undefined,
          }
        : undefined,
      payment: refund.payment
        ? {
            id: refund.payment.id,
            method: refund.payment.method,
            amount: Number(refund.payment.amount),
            status: refund.payment.status,
            transactionRef: refund.payment.transactionRef || null,
          }
        : undefined,
    };
  }

  // ===========================================================================
  // Transactions / Payments
  // ===========================================================================

  /**
   * Paginated list of payments/transactions with search and filtering
   */
  async getPayments(
    query: QueryPaymentsDto,
  ): Promise<PaginatedPaymentsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.method) {
      where.method = query.method;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { transactionRef: { contains: term, mode: 'insensitive' } },
        { order: { orderNumber: { contains: term, mode: 'insensitive' } } },
        { order: { recipientName: { contains: term, mode: 'insensitive' } } },
        { order: { recipientPhone: { contains: term, mode: 'insensitive' } } },
        { order: { user: { name: { contains: term, mode: 'insensitive' } } } },
        {
          order: { user: { email: { contains: term, mode: 'insensitive' } } },
        },
      ];
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

    let orderBy: Prisma.PaymentOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'amount') {
      orderBy = { amount: query.sortOrder || 'desc' };
    } else {
      orderBy = { createdAt: query.sortOrder || 'desc' };
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.paymentIncludes,
      }),
    ]);

    return {
      data: payments.map((p) => this.mapPayment(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single payment details by ID
   */
  async getPaymentById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: this.paymentIncludes,
    });

    if (!payment) {
      throw new NotFoundException(`Payment transaction with ID '${id}' not found`);
    }

    return this.mapPayment(payment);
  }

  /**
   * Record a new payment transaction against an order
   */
  async createPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' not found`);
    }

    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: this.paymentIncludes,
      });
      if (existing) {
        return this.mapPayment(existing);
      }
    }

    const paymentStatus = dto.status || PaymentStatus.PENDING;
    const paidAt =
      paymentStatus === PaymentStatus.PAID
        ? dto.paidAt
          ? new Date(dto.paidAt)
          : new Date()
        : null;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          method: dto.method || PaymentMethod.CASH_ON_DELIVERY,
          status: paymentStatus,
          amount: dto.amount,
          currency: dto.currency || 'BDT',
          transactionRef: dto.transactionRef?.trim() || null,
          idempotencyKey: dto.idempotencyKey?.trim() || null,
          notes: dto.notes?.trim() || null,
          paidAt,
        },
        include: this.paymentIncludes,
      });

      // Synchronize Order payment status if this payment is marked as PAID
      if (paymentStatus === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: dto.orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: dto.orderId,
            fromStatus: order.orderStatus,
            toStatus: order.orderStatus,
            notes: `Payment of ${dto.amount} ${created.currency} confirmed (${created.method}). Ref: ${created.transactionRef || 'N/A'}`,
          },
        });
      }

      return this.mapPayment(created);
    });
  }

  /**
   * Update payment status (e.g. mark pending COD as PAID or FAILED)
   */
  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
    adminUserId?: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment transaction with ID '${id}' not found`);
    }

    const prevStatus = payment.status;
    const targetStatus = dto.status;

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.PaymentUpdateInput = {
        status: targetStatus,
      };

      if (dto.transactionRef !== undefined) {
        updateData.transactionRef = dto.transactionRef?.trim() || null;
      }
      if (dto.notes !== undefined) {
        updateData.notes = dto.notes?.trim() || null;
      }

      if (targetStatus === PaymentStatus.PAID && !payment.paidAt) {
        updateData.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      }

      const updated = await tx.payment.update({
        where: { id },
        data: updateData,
        include: this.paymentIncludes,
      });

      // Order synchronization on status transition
      if (targetStatus === PaymentStatus.PAID && prevStatus !== PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: payment.order.orderStatus,
            toStatus: payment.order.orderStatus,
            notes: `Payment '${updated.transactionRef || id}' marked as PAID. Notes: ${dto.notes || 'None'}`,
            changedByUserId: adminUserId || null,
          },
        });
      } else if (
        targetStatus === PaymentStatus.FAILED &&
        prevStatus !== PaymentStatus.FAILED
      ) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: payment.order.orderStatus,
            toStatus: payment.order.orderStatus,
            notes: `Payment '${updated.transactionRef || id}' marked as FAILED. Notes: ${dto.notes || 'None'}`,
            changedByUserId: adminUserId || null,
          },
        });
      }

      return this.mapPayment(updated);
    });
  }

  /**
   * Aggregated financial and transaction summary metrics
   */
  async getPaymentStats(): Promise<PaymentStatsResponseDto> {
    const [
      allPayments,
      refundsAgg,
      pendingRefundsCount,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        select: {
          amount: true,
          status: true,
          method: true,
        },
      }),
      this.prisma.refund.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { status: RefundStatus.COMPLETED },
      }),
      this.prisma.refund.count({
        where: { status: RefundStatus.PENDING },
      }),
    ]);

    let totalVolume = 0;
    let totalCollected = 0;
    let totalPendingCod = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    for (const p of allPayments) {
      const amt = Number(p.amount);
      totalVolume += amt;

      if (p.status === PaymentStatus.PAID) {
        totalCollected += amt;
        paidCount++;
      } else if (p.status === PaymentStatus.PENDING) {
        pendingCount++;
        if (p.method === PaymentMethod.CASH_ON_DELIVERY) {
          totalPendingCod += amt;
        }
      } else if (p.status === PaymentStatus.FAILED) {
        failedCount++;
      }
    }

    const totalRefunded = Number(refundsAgg._sum.amount || 0);
    const refundCount = refundsAgg._count.id || 0;

    return {
      totalVolume,
      totalCollected,
      totalPendingCod,
      totalRefunded,
      transactionCount: allPayments.length,
      paidCount,
      pendingCount,
      failedCount,
      refundCount,
      pendingRefundCount: pendingRefundsCount,
    };
  }

  // ===========================================================================
  // Refunds Management
  // ===========================================================================

  /**
   * Paginated list of refunds with search and filtering
   */
  async getRefunds(query: QueryRefundsDto): Promise<PaginatedRefundsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.paymentId) {
      where.paymentId = query.paymentId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { transactionRef: { contains: term, mode: 'insensitive' } },
        { reason: { contains: term, mode: 'insensitive' } },
        { order: { orderNumber: { contains: term, mode: 'insensitive' } } },
        { order: { recipientName: { contains: term, mode: 'insensitive' } } },
        { order: { user: { name: { contains: term, mode: 'insensitive' } } } },
        {
          order: { user: { email: { contains: term, mode: 'insensitive' } } },
        },
      ];
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

    let orderBy: Prisma.RefundOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'amount') {
      orderBy = { amount: query.sortOrder || 'desc' };
    } else {
      orderBy = { createdAt: query.sortOrder || 'desc' };
    }

    const [total, refunds] = await Promise.all([
      this.prisma.refund.count({ where }),
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.refundIncludes,
      }),
    ]);

    return {
      data: refunds.map((r) => this.mapRefund(r)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single refund by ID
   */
  async getRefundById(id: string): Promise<RefundResponseDto> {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: this.refundIncludes,
    });

    if (!refund) {
      throw new NotFoundException(`Refund record with ID '${id}' not found`);
    }

    return this.mapRefund(refund);
  }

  /**
   * Issue a refund for an order with balance protection
   */
  async createRefund(
    dto: CreateRefundDto,
    adminUserId?: string,
  ): Promise<RefundResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        payments: true,
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' not found`);
    }

    // Determine target payment
    let targetPayment: any;
    if (dto.paymentId) {
      targetPayment = order.payments.find((p) => p.id === dto.paymentId);
      if (!targetPayment) {
        throw new NotFoundException(
          `Payment transaction '${dto.paymentId}' does not belong to order '${dto.orderId}'`,
        );
      }
    } else {
      // Pick the first PAID payment, or any payment
      targetPayment =
        order.payments.find((p) => p.status === PaymentStatus.PAID) ||
        order.payments[0];
    }

    if (!targetPayment) {
      throw new BadRequestException(
        `Order '${order.orderNumber}' has no recorded payment transactions to refund against.`,
      );
    }

    // Balance check: verify total completed refunds do not exceed total paid amount
    const totalPaid = order.payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const alreadyRefunded = order.refunds
      .filter((r) => r.status === RefundStatus.COMPLETED)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const maxRefundable = Math.max(0, totalPaid - alreadyRefunded);

    if (dto.amount > maxRefundable + 0.001) {
      throw new BadRequestException(
        `Requested refund amount of BDT ${dto.amount.toFixed(2)} exceeds remaining refundable balance of BDT ${maxRefundable.toFixed(2)} for Order ${order.orderNumber}.`,
      );
    }

    const refundStatus = dto.status || RefundStatus.COMPLETED;
    const refundMethod = dto.refundMethod || targetPayment.method;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.refund.create({
        data: {
          orderId: dto.orderId,
          paymentId: targetPayment.id,
          amount: dto.amount,
          reason: dto.reason.trim(),
          status: refundStatus,
          refundMethod,
          transactionRef: dto.transactionRef?.trim() || null,
          notes: dto.notes?.trim() || null,
          processedByUserId: adminUserId || null,
        },
        include: this.refundIncludes,
      });

      if (refundStatus === RefundStatus.COMPLETED) {
        const newTotalRefunded = alreadyRefunded + dto.amount;

        // If order is now fully refunded, update order payment status
        if (newTotalRefunded >= totalPaid - 0.001 && totalPaid > 0) {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: PaymentStatus.REFUNDED },
          });

          await tx.payment.update({
            where: { id: targetPayment.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.orderStatus,
            toStatus: order.orderStatus,
            notes: `Refund of BDT ${dto.amount} processed (${refundMethod}). Reason: ${dto.reason.trim()}`,
            changedByUserId: adminUserId || null,
          },
        });
      }

      return this.mapRefund(created);
    });
  }

  /**
   * Update refund resolution status (e.g. approve or reject pending refund)
   */
  async updateRefundStatus(
    id: string,
    dto: UpdateRefundStatusDto,
    adminUserId?: string,
  ): Promise<RefundResponseDto> {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        order: {
          include: { payments: true, refunds: true },
        },
        payment: true,
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID '${id}' not found`);
    }

    if (refund.status === dto.status) {
      return this.getRefundById(id);
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RefundUpdateInput = {
        status: dto.status,
      };

      if (dto.transactionRef !== undefined) {
        updateData.transactionRef = dto.transactionRef?.trim() || null;
      }
      if (dto.notes !== undefined) {
        updateData.notes = dto.notes?.trim() || null;
      }
      if (adminUserId) {
        updateData.processedByUser = { connect: { id: adminUserId } };
      }

      if (
        dto.status === RefundStatus.COMPLETED &&
        refund.status !== RefundStatus.COMPLETED
      ) {
        // Balance check
        const totalPaid = refund.order.payments
          .filter((p) => p.status === PaymentStatus.PAID)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const otherCompletedRefunds = refund.order.refunds
          .filter((r) => r.id !== refund.id && r.status === RefundStatus.COMPLETED)
          .reduce((sum, r) => sum + Number(r.amount), 0);

        const newTotalRefunded = otherCompletedRefunds + Number(refund.amount);

        if (newTotalRefunded > totalPaid + 0.001) {
          throw new BadRequestException(
            `Approving this refund of BDT ${Number(refund.amount).toFixed(2)} would exceed total paid amount of BDT ${totalPaid.toFixed(2)}.`,
          );
        }

        if (newTotalRefunded >= totalPaid - 0.001 && totalPaid > 0) {
          await tx.order.update({
            where: { id: refund.orderId },
            data: { paymentStatus: PaymentStatus.REFUNDED },
          });

          await tx.payment.update({
            where: { id: refund.paymentId },
            data: { status: PaymentStatus.REFUNDED },
          });
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: refund.orderId,
            fromStatus: refund.order.orderStatus,
            toStatus: refund.order.orderStatus,
            notes: `Refund of BDT ${refund.amount} APPROVED. Ref: ${dto.transactionRef || refund.transactionRef || 'N/A'}. Notes: ${dto.notes || 'None'}`,
            changedByUserId: adminUserId || null,
          },
        });
      } else if (
        dto.status === RefundStatus.REJECTED &&
        refund.status !== RefundStatus.REJECTED
      ) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: refund.orderId,
            fromStatus: refund.order.orderStatus,
            toStatus: refund.order.orderStatus,
            notes: `Refund request of BDT ${refund.amount} REJECTED. Notes: ${dto.notes || 'None'}`,
            changedByUserId: adminUserId || null,
          },
        });
      }

      const updated = await tx.refund.update({
        where: { id },
        data: updateData,
        include: this.refundIncludes,
      });

      return this.mapRefund(updated);
    });
  }

  /**
   * Default seed definitions for payment methods
   */
  private readonly defaultPaymentMethods = [
    {
      code: 'CASH_ON_DELIVERY',
      name: 'Cash on Delivery',
      description: 'Pay with cash upon delivery of your items.',
      instructions: 'Please have the exact cash ready when the delivery rider arrives at your doorstep.',
      isEnabled: true,
      sortOrder: 1,
    },
    {
      code: 'CHECK_PAYMENT',
      name: 'Check / Cheque Payment',
      description: 'Pay via bank check, banker cheque, or money order.',
      instructions: 'Please send your check payable to "A to Z E-Commerce Ltd.", Mail to: House 12, Road 5, Dhanmondi, Dhaka 1205. Your order will be dispatched once the check clears.',
      isEnabled: false,
      sortOrder: 2,
    },
    {
      code: 'BANK_TRANSFER',
      name: 'Direct Bank Transfer',
      description: 'Make a direct wire or transfer to our corporate bank account.',
      instructions: 'Bank: City Bank Ltd. Account Name: A to Z E-Commerce Ltd. Account Number: 1102938475001. Branch: Gulshan 1, Dhaka. Please use your Order Number as payment reference.',
      isEnabled: false,
      sortOrder: 3,
    },
    {
      code: 'MOBILE_BANKING',
      name: 'Mobile Banking (bKash / Nagad)',
      description: 'Pay instantly using bKash, Nagad, or Rocket mobile wallet.',
      instructions: 'Please send payment to Merchant bKash/Nagad Number: 01700000000 (Counter: 1). Enter your Order Number in the reference field.',
      isEnabled: false,
      sortOrder: 4,
    },
    {
      code: 'PAYSTATION',
      name: 'PayStation Online Gateway',
      description: 'Pay securely using bKash, Nagad, Rocket, Visa, Mastercard, or Internet Banking.',
      instructions: 'You will be redirected to the secure PayStation payment portal to complete your transaction with instant confirmation.',
      isEnabled: true,
      sortOrder: 5,
      merchantId: '104-1653730183',
      password: 'gamecoderstorepass',
      isSandbox: true,
    },
  ];

  /**
   * Ensure default payment methods exist in the database
   */
  async ensureDefaultPaymentMethods(): Promise<void> {
    for (const def of this.defaultPaymentMethods) {
      await this.prisma.paymentMethodSetting.upsert({
        where: { code: def.code },
        update: {},
        create: def,
      });
    }
  }

  /**
   * Retrieve all payment methods (Admin view)
   */
  async findAllPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
    await this.ensureDefaultPaymentMethods();
    return this.prisma.paymentMethodSetting.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Retrieve active payment methods only (Public / Storefront checkout)
   */
  async findActivePaymentMethods(): Promise<ActivePaymentMethodDto[]> {
    await this.ensureDefaultPaymentMethods();
    return this.prisma.paymentMethodSetting.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        code: true,
        name: true,
        description: true,
        instructions: true,
        sortOrder: true,
      },
    });
  }

  /**
   * Retrieve single payment method by ID
   */
  async findPaymentMethodById(id: string): Promise<PaymentMethodResponseDto> {
    const method = await this.prisma.paymentMethodSetting.findUnique({
      where: { id },
    });
    if (!method) {
      throw new NotFoundException(`Payment method with ID '${id}' not found`);
    }
    return method;
  }

  /**
   * Update payment method configuration
   */
  async updatePaymentMethod(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const existing = await this.prisma.paymentMethodSetting.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Payment method with ID '${id}' not found`);
    }

    return this.prisma.paymentMethodSetting.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.merchantId !== undefined && { merchantId: dto.merchantId }),
        ...(dto.password !== undefined && { password: dto.password }),
        ...(dto.isSandbox !== undefined && { isSandbox: dto.isSandbox }),
      },
    });
  }

  /**
   * Toggle on/off status of a payment method
   */
  async togglePaymentMethod(
    id: string,
    dto?: TogglePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const existing = await this.prisma.paymentMethodSetting.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Payment method with ID '${id}' not found`);
    }

    const nextState =
      dto?.isEnabled !== undefined ? dto.isEnabled : !existing.isEnabled;

    return this.prisma.paymentMethodSetting.update({
      where: { id },
      data: { isEnabled: nextState },
    });
  }
}

