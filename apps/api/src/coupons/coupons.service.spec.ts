import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { CouponsService } from './coupons.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('CouponsService', () => {
  let service: CouponsService;
  let mockPrisma: any;
  let mockAuditLogs: any;

  beforeEach(() => {
    mockPrisma = {
      coupon: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      couponUsage: {
        count: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    mockAuditLogs = {
      log: vi.fn().mockResolvedValue(null),
    };

    service = new CouponsService(
      mockPrisma as unknown as PrismaService,
      mockAuditLogs,
    );
  });

  describe('validateAndCalculateDiscount', () => {
    it('throws BadRequestException if coupon code is empty', async () => {
      await expect(service.validateAndCalculateDiscount('', 1500)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if coupon does not exist or is inactive', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.validateAndCalculateDiscount('INVALID', 1500),
      ).rejects.toThrow("Coupon 'INVALID' is invalid or no longer active.");
    });

    it('throws BadRequestException if coupon is expired', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-1',
        code: 'EXPIRED',
        isActive: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-01'),
        minOrderAmount: null,
        totalUsageLimit: null,
        perCustomerLimit: 1,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(500),
        maxDiscountAmount: null,
      });

      await expect(
        service.validateAndCalculateDiscount('EXPIRED', 1500),
      ).rejects.toThrow("Coupon 'EXPIRED' has expired.");
    });

    it('throws BadRequestException if subtotal is below minimum order amount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-2',
        code: 'AZDEAL',
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        minOrderAmount: new Prisma.Decimal(1000),
        totalUsageLimit: null,
        perCustomerLimit: 1,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(500),
        maxDiscountAmount: null,
      });

      await expect(
        service.validateAndCalculateDiscount('AZDEAL', 800),
      ).rejects.toThrow(
        "Minimum order amount of BDT 1,000 required for coupon 'AZDEAL'.",
      );
    });

    it('calculates fixed amount discount properly', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-2',
        code: 'AZDEAL',
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        minOrderAmount: new Prisma.Decimal(1000),
        totalUsageLimit: 100,
        perCustomerLimit: 1,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(500),
        maxDiscountAmount: null,
      });
      mockPrisma.couponUsage.count.mockResolvedValue(10);

      const result = await service.validateAndCalculateDiscount('AZDEAL', 2500);
      expect(result.discountAmount).toBe(500);
    });

    it('calculates percentage discount capped at maxDiscountAmount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-3',
        code: 'TECH10',
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        minOrderAmount: new Prisma.Decimal(500),
        totalUsageLimit: null,
        perCustomerLimit: 2,
        discountType: DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal(10),
        maxDiscountAmount: new Prisma.Decimal(2000),
      });

      const result = await service.validateAndCalculateDiscount('TECH10', 30000);
      expect(result.discountAmount).toBe(2000);
    });

    it('enforces perCustomerLimit for authenticated user', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-2',
        code: 'AZDEAL',
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-12-31'),
        minOrderAmount: new Prisma.Decimal(1000),
        totalUsageLimit: null,
        perCustomerLimit: 1,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(500),
        maxDiscountAmount: null,
      });
      mockPrisma.couponUsage.count.mockResolvedValue(1);

      await expect(
        service.validateAndCalculateDiscount('AZDEAL', 2500, 'user-123'),
      ).rejects.toThrow(
        "You have already reached the redemption limit (1) for coupon 'AZDEAL'.",
      );
    });
  });

  describe('Admin CRUD & Lifecycle Management', () => {
    it('creates a new coupon and logs audit entry', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      mockPrisma.coupon.create.mockResolvedValue({
        id: 'coupon-new',
        code: 'EID2026',
        description: 'Eid Festive Offer',
        discountType: DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal(15),
        minOrderAmount: new Prisma.Decimal(2000),
        maxDiscountAmount: new Prisma.Decimal(1500),
        totalUsageLimit: 200,
        perCustomerLimit: 1,
        startDate: new Date('2026-01-01T00:00:00Z'),
        endDate: new Date('2027-12-31T23:59:59Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { usages: 0 },
        usages: [],
      });

      const created = await service.create(
        {
          code: 'eid2026',
          description: 'Eid Festive Offer',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 15,
          minOrderAmount: 2000,
          maxDiscountAmount: 1500,
          totalUsageLimit: 200,
          perCustomerLimit: 1,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2027-12-31T23:59:59Z',
          isActive: true,
        },
        'admin-1',
      );

      expect(created.code).toBe('EID2026');
      expect(created.computedStatus).toBe('LIVE');
      expect(mockAuditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'COUPON_CREATE',
          entityType: 'Coupon',
          entityId: 'coupon-new',
        }),
      );
    });

    it('rejects duplicate coupon code on create with ConflictException', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          code: 'AZDEAL',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 500,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2027-12-31T23:59:59Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects percentage discount greater than 100%', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'OVER100',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 120,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2027-12-31T23:59:59Z',
        }),
      ).rejects.toThrow('Percentage discount value cannot exceed 100%.');
    });

    it('rejects endDate earlier than or equal to startDate', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'BADDATE',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 100,
          startDate: '2027-06-01T00:00:00Z',
          endDate: '2027-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('End date must be strictly after the start date.');
    });

    it('soft-deactivates coupon on remove if historical redemptions exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-used',
        code: 'AZDEAL',
        isActive: true,
        _count: { usages: 5 },
      });
      mockPrisma.coupon.update.mockResolvedValue({});

      const res = await service.remove('coupon-used', 'admin-1');
      expect(res.deactivated).toBe(true);
      expect(mockPrisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-used' },
        data: { isActive: false },
      });
      expect(mockPrisma.coupon.delete).not.toHaveBeenCalled();
    });

    it('permanently deletes coupon on remove if usages count is 0', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue({
        id: 'coupon-unused',
        code: 'UNUSED',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: new Prisma.Decimal(100),
        isActive: true,
        _count: { usages: 0 },
      });
      mockPrisma.coupon.delete.mockResolvedValue({});

      const res = await service.remove('coupon-unused', 'admin-1');
      expect(res.deactivated).toBe(false);
      expect(mockPrisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: 'coupon-unused' },
      });
    });

    it('throws NotFoundException when finding non-existent coupon by id', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.findOneAdmin('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
