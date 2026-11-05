import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembershipsService } from './memberships.service.js';
import { MembershipPaymentStatus, SubscriptionStatus } from '@prisma/client';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prismaMock: any;
  let configMock: any;

  beforeEach(() => {
    prismaMock = {
      membershipPlan: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      subscription: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      membershipPayment: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((fnOrArray) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(prismaMock);
        }
        return Promise.all(fnOrArray);
      }),
    };

    configMock = {
      get: vi.fn((key: string) => {
        if (key === 'STORE_URL') return 'http://localhost:3000';
        return null;
      }),
    };

    const paystationMock = {
      createCustomCharge: vi.fn().mockResolvedValue({
        status: 'success',
        payment_url: 'https://sandbox.paystation.com.bd/checkout/mock-url',
        invoice_number: 'MEM-TEST',
        message: 'Payment link generated',
      }),
      getTransactionDetails: vi.fn().mockResolvedValue({
        status: 'success',
        data: { trx_id: 'PS-TXN-12345' },
      }),
    };

    service = new MembershipsService(prismaMock, configMock, paystationMock as any);
  });

  describe('getPlans', () => {
    it('returns only active plans ordered by sortOrder', async () => {
      const mockPlans = [
        { id: '1', name: 'Monthly', sortOrder: 1, isActive: true },
        { id: '2', name: 'Annual', sortOrder: 2, isActive: true },
      ];
      prismaMock.membershipPlan.findMany.mockResolvedValue(mockPlans);

      const result = await service.getPlans();
      expect(result).toEqual(mockPlans);
      expect(prismaMock.membershipPlan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('checkUserAccess', () => {
    it('returns true when user has active unexpired subscription', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 86400000),
      });

      const hasAccess = await service.checkUserAccess('user-1');
      expect(hasAccess).toBe(true);
    });

    it('returns false when no active subscription is found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(null);

      const hasAccess = await service.checkUserAccess('user-2');
      expect(hasAccess).toBe(false);
    });
  });

  describe('initiateCheckout', () => {
    it('creates a PENDING membership payment and returns checkout details', async () => {
      prismaMock.membershipPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        name: 'Monthly Plan',
        price: 299,
        durationDays: 30,
        isActive: true,
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+8801700000000',
        email: 'user@example.com',
      });

      prismaMock.membershipPayment.create.mockResolvedValue({
        id: 'pay-123',
        amount: 299,
        status: MembershipPaymentStatus.PENDING,
      });

      const res = await service.initiateCheckout('user-1', { planId: 'plan-1' });
      expect(res.paymentId).toBe('pay-123');
      expect(res.amount).toBe(299);
      expect(res.paymentUrl).toContain('paystation.com.bd');
    });

    it('throws BadRequestException if plan is inactive', async () => {
      prismaMock.membershipPlan.findUnique.mockResolvedValue({
        id: 'plan-2',
        name: 'Deprecated Plan',
        price: 199,
        isActive: false,
      });

      await expect(
        service.initiateCheckout('user-1', { planId: 'plan-2' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleCallback', () => {
    it('activates subscription on successful payment callback with stacking dates', async () => {
      const mockPayment = {
        id: 'pay-1',
        userId: 'user-1',
        planId: 'plan-1',
        amount: 299,
        status: MembershipPaymentStatus.PENDING,
        rawPayload: {},
        plan: { id: 'plan-1', name: 'Monthly Plan', durationDays: 30 },
        user: { id: 'user-1' },
      };

      prismaMock.membershipPayment.findUnique.mockResolvedValue(mockPayment);
      prismaMock.subscription.findFirst.mockResolvedValue(null); // No existing active sub
      prismaMock.membershipPayment.update.mockResolvedValue({
        ...mockPayment,
        status: MembershipPaymentStatus.PAID,
      });
      prismaMock.subscription.create.mockResolvedValue({
        id: 'sub-new',
        status: SubscriptionStatus.ACTIVE,
      });

      const res = await service.handleCallback(
        { status: 'Success', trx_id: 'TRX-123' },
        'pay-1',
      );

      expect(res.success).toBe(true);
      expect(prismaMock.subscription.create).toHaveBeenCalled();
    });

    it('is idempotent if payment was already processed as PAID', async () => {
      const mockPayment = {
        id: 'pay-already-paid',
        status: MembershipPaymentStatus.PAID,
        plan: { id: 'plan-1' },
      };
      prismaMock.membershipPayment.findUnique.mockResolvedValue(mockPayment);
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 'sub-existing',
        status: SubscriptionStatus.ACTIVE,
      });

      const res = await service.handleCallback({ status: 'Success' }, 'pay-already-paid');
      expect(res.success).toBe(true);
      expect(res.message).toBe('Payment already processed');
      expect(prismaMock.subscription.create).not.toHaveBeenCalled();
    });
  });
});

