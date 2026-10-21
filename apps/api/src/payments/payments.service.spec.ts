import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import {
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  OrderStatus,
} from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      payment: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refund: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(prismaMock);
      }),
    };

    service = new PaymentsService(prismaMock);
  });

  describe('createPayment', () => {
    it('should create a payment and synchronize order payment status when PAID', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-0001',
        orderStatus: OrderStatus.PENDING,
        grandTotal: 1500.0,
      };

      const mockCreatedPayment = {
        id: 'pay-1',
        orderId: 'order-1',
        method: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PAID,
        amount: 1500.0,
        currency: 'BDT',
        transactionRef: 'COD-REC-001',
        idempotencyKey: null,
        notes: 'Doorstep cash collected',
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
        order: {
          id: 'order-1',
          orderNumber: 'AZ-2026-0001',
          grandTotal: 1500.0,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PAID,
          recipientName: 'Karim',
          recipientPhone: '01711111111',
          user: { name: 'Karim', email: 'karim@example.com' },
        },
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.payment.create.mockResolvedValue(mockCreatedPayment);
      prismaMock.order.update.mockResolvedValue({ ...mockOrder, paymentStatus: PaymentStatus.PAID });
      prismaMock.orderStatusHistory.create.mockResolvedValue({ id: 'hist-1' });

      const result = await service.createPayment({
        orderId: 'order-1',
        method: PaymentMethod.CASH_ON_DELIVERY,
        amount: 1500.0,
        status: PaymentStatus.PAID,
        transactionRef: 'COD-REC-001',
        notes: 'Doorstep cash collected',
      });

      expect(result.id).toBe('pay-1');
      expect(result.amount).toBe(1500.0);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paymentStatus: PaymentStatus.PAID },
      });
    });

    it('should return existing payment if idempotencyKey already exists', async () => {
      const mockExisting = {
        id: 'pay-1',
        orderId: 'order-1',
        method: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PENDING,
        amount: 1500.0,
        currency: 'BDT',
        idempotencyKey: 'idemp-123',
        refunds: [],
      };

      prismaMock.order.findUnique.mockResolvedValue({ id: 'order-1' });
      prismaMock.payment.findUnique.mockResolvedValue(mockExisting);

      const result = await service.createPayment({
        orderId: 'order-1',
        amount: 1500.0,
        idempotencyKey: 'idemp-123',
      });

      expect(result.id).toBe('pay-1');
      expect(prismaMock.payment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment({
          orderId: 'non-existent',
          amount: 500,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to PAID and update order', async () => {
      const mockPayment = {
        id: 'pay-1',
        orderId: 'order-1',
        status: PaymentStatus.PENDING,
        amount: 1000,
        paidAt: null,
        order: { id: 'order-1', orderStatus: OrderStatus.CONFIRMED },
      };

      const mockUpdated = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        transactionRef: 'REF-999',
        paidAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
      };

      prismaMock.payment.findUnique.mockResolvedValue(mockPayment);
      prismaMock.payment.update.mockResolvedValue(mockUpdated);
      prismaMock.order.update.mockResolvedValue({});
      prismaMock.orderStatusHistory.create.mockResolvedValue({});

      const result = await service.updatePaymentStatus('pay-1', {
        status: PaymentStatus.PAID,
        transactionRef: 'REF-999',
      }, 'admin-1');

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paymentStatus: PaymentStatus.PAID },
      });
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus('non-existent', {
          status: PaymentStatus.PAID,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRefund', () => {
    it('should issue a refund successfully when within refundable limit', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-0001',
        orderStatus: OrderStatus.DELIVERED,
        payments: [
          {
            id: 'pay-1',
            status: PaymentStatus.PAID,
            amount: 2000.0,
            method: PaymentMethod.CASH_ON_DELIVERY,
          },
        ],
        refunds: [],
      };

      const mockCreatedRefund = {
        id: 'ref-1',
        orderId: 'order-1',
        paymentId: 'pay-1',
        amount: 500.0,
        reason: 'Customer returned 1 defective item',
        status: RefundStatus.COMPLETED,
        refundMethod: PaymentMethod.CASH_ON_DELIVERY,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: {
          id: 'order-1',
          orderNumber: 'AZ-2026-0001',
          grandTotal: 2000.0,
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          recipientName: 'Karim',
          recipientPhone: '01711111111',
        },
        payment: {
          id: 'pay-1',
          method: PaymentMethod.CASH_ON_DELIVERY,
          amount: 2000.0,
          status: PaymentStatus.PAID,
        },
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.refund.create.mockResolvedValue(mockCreatedRefund);
      prismaMock.orderStatusHistory.create.mockResolvedValue({});

      const result = await service.createRefund({
        orderId: 'order-1',
        amount: 500.0,
        reason: 'Customer returned 1 defective item',
      }, 'admin-1');

      expect(result.id).toBe('ref-1');
      expect(result.amount).toBe(500.0);
      expect(result.status).toBe(RefundStatus.COMPLETED);
    });

    it('should reject refund exceeding total refundable balance', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-0001',
        payments: [
          { id: 'pay-1', status: PaymentStatus.PAID, amount: 1000.0 },
        ],
        refunds: [
          { id: 'ref-0', status: RefundStatus.COMPLETED, amount: 800.0 },
        ],
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      // Remaining refundable is 200, but requesting 500
      await expect(
        service.createRefund({
          orderId: 'order-1',
          amount: 500.0,
          reason: 'Excess refund test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should transition order and payment status to REFUNDED when fully refunded', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-0001',
        orderStatus: OrderStatus.RETURNED,
        payments: [
          { id: 'pay-1', status: PaymentStatus.PAID, amount: 1000.0, method: PaymentMethod.CASH_ON_DELIVERY },
        ],
        refunds: [],
      };

      const mockCreatedRefund = {
        id: 'ref-1',
        orderId: 'order-1',
        paymentId: 'pay-1',
        amount: 1000.0,
        reason: 'Full return refund',
        status: RefundStatus.COMPLETED,
        refundMethod: PaymentMethod.CASH_ON_DELIVERY,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: mockOrder,
        payment: mockOrder.payments[0],
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.refund.create.mockResolvedValue(mockCreatedRefund);
      prismaMock.order.update.mockResolvedValue({});
      prismaMock.payment.update.mockResolvedValue({});
      prismaMock.orderStatusHistory.create.mockResolvedValue({});

      await service.createRefund({
        orderId: 'order-1',
        amount: 1000.0,
        reason: 'Full return refund',
      });

      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paymentStatus: PaymentStatus.REFUNDED },
      });
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.REFUNDED },
      });
    });
  });

  describe('getPaymentStats', () => {
    it('should correctly aggregate volume, collections, pending COD, and refunds', async () => {
      prismaMock.payment.findMany.mockResolvedValue([
        { amount: 1000, status: PaymentStatus.PAID, method: PaymentMethod.CASH_ON_DELIVERY },
        { amount: 500, status: PaymentStatus.PENDING, method: PaymentMethod.CASH_ON_DELIVERY },
        { amount: 200, status: PaymentStatus.FAILED, method: PaymentMethod.CREDIT_CARD },
      ]);

      prismaMock.refund.aggregate.mockResolvedValue({
        _sum: { amount: 300 },
        _count: { id: 2 },
      });

      prismaMock.refund.count.mockResolvedValue(1);

      const stats = await service.getPaymentStats();

      expect(stats.totalVolume).toBe(1700);
      expect(stats.totalCollected).toBe(1000);
      expect(stats.totalPendingCod).toBe(500);
      expect(stats.totalRefunded).toBe(300);
      expect(stats.transactionCount).toBe(3);
      expect(stats.paidCount).toBe(1);
      expect(stats.pendingCount).toBe(1);
      expect(stats.failedCount).toBe(1);
      expect(stats.refundCount).toBe(2);
      expect(stats.pendingRefundCount).toBe(1);
    });
  });
});
