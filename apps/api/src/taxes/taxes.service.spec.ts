import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaxesService } from './taxes.service.js';

describe('TaxesService', () => {
  let service: TaxesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      taxClass: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
    };

    service = new TaxesService(prismaMock);
  });

  describe('create', () => {
    it('should create a new tax class', async () => {
      prismaMock.taxClass.findUnique.mockResolvedValue(null);
      prismaMock.taxClass.create.mockResolvedValue({
        id: 'tc-1',
        name: 'Standard Electronics VAT',
        code: 'VAT-ELEC-5',
        rate: 5.0,
        isDefault: false,
        isActive: true,
        description: 'Test VAT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        name: 'Standard Electronics VAT',
        code: 'VAT-ELEC-5',
        rate: 5.0,
      });

      expect(result.id).toBe('tc-1');
      expect(result.code).toBe('VAT-ELEC-5');
      expect(result.rate).toBe(5.0);
    });

    it('should throw ConflictException if tax code already exists', async () => {
      prismaMock.taxClass.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          name: 'Duplicate',
          code: 'VAT-ELEC-5',
          rate: 5.0,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('calculateLineItemTax', () => {
    it('should extract embedded VAT from tax-inclusive price at 15%', () => {
      // 11,500 gross price at 15% VAT:
      // net = 11,500 / 1.15 = 10,000.00
      // tax = 1,500.00
      const calc = service.calculateLineItemTax(11500, 1, 15.0, 'General VAT');

      expect(calc.netUnitPrice).toBe(10000.0);
      expect(calc.unitTax).toBe(1500.0);
      expect(calc.totalGross).toBe(11500.0);
      expect(calc.totalTax).toBe(1500.0);
      expect(calc.totalNet).toBe(10000.0);
      expect(calc.taxRate).toBe(15.0);
    });

    it('should handle multiple quantities correctly', () => {
      const calc = service.calculateLineItemTax(11500, 2, 15.0, 'General VAT');

      expect(calc.netUnitPrice).toBe(10000.0);
      expect(calc.unitTax).toBe(1500.0);
      expect(calc.totalGross).toBe(23000.0);
      expect(calc.totalTax).toBe(3000.0);
      expect(calc.totalNet).toBe(20000.0);
    });

    it('should return 0 tax for zero-rated items', () => {
      const calc = service.calculateLineItemTax(2500, 2, 0, 'Zero-Rated');

      expect(calc.netUnitPrice).toBe(2500);
      expect(calc.unitTax).toBe(0);
      expect(calc.totalGross).toBe(5000);
      expect(calc.totalTax).toBe(0);
      expect(calc.totalNet).toBe(5000);
    });
  });

  describe('calculateOrderTax', () => {
    it('should sum multiple line items with different tax rates accurately', () => {
      const items = [
        { unitPrice: 11500, quantity: 1, taxRate: 15.0, taxClassName: 'General VAT' },
        { unitPrice: 10500, quantity: 1, taxRate: 5.0, taxClassName: 'Electronics VAT' }, // net: 10,000, tax: 500
      ];

      const summary = service.calculateOrderTax(items);

      expect(summary.totalGross).toBe(22000.0);
      expect(summary.totalTax).toBe(2000.0);
      expect(summary.totalNet).toBe(20000.0);
      expect(summary.items).toHaveLength(2);
    });
  });

  describe('resolveEffectiveTaxClass', () => {
    it('should use Product tax class when set and active', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'p-1',
        taxClass: { id: 'tc-special', name: 'Special 5%', rate: 5.0, isActive: true },
      });

      const resolved = await service.resolveEffectiveTaxClass({ productId: 'p-1' });

      expect(resolved.taxRate).toBe(5.0);
      expect(resolved.taxClassName).toBe('Special 5%');
      expect(resolved.taxClassId).toBe('tc-special');
    });

    it('should fallback to Category tax class when Product has no taxClass', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'p-1',
        categoryId: 'cat-1',
        taxClass: null,
      });
      prismaMock.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        taxClass: { id: 'tc-cat', name: 'Category 15%', rate: 15.0, isActive: true },
      });

      const resolved = await service.resolveEffectiveTaxClass({ productId: 'p-1' });

      expect(resolved.taxRate).toBe(15.0);
      expect(resolved.taxClassName).toBe('Category 15%');
      expect(resolved.taxClassId).toBe('tc-cat');
    });

    it('should fallback to Store Default when neither product nor category defines tax', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'p-1',
        categoryId: 'cat-1',
        taxClass: null,
      });
      prismaMock.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        taxClass: null,
      });
      prismaMock.taxClass.findFirst.mockResolvedValue({
        id: 'tc-default',
        name: 'Default Store VAT',
        rate: 7.5,
        isActive: true,
      });

      const resolved = await service.resolveEffectiveTaxClass({ productId: 'p-1' });

      expect(resolved.taxRate).toBe(7.5);
      expect(resolved.taxClassName).toBe('Default Store VAT');
      expect(resolved.taxClassId).toBe('tc-default');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException when deleting a default tax class', async () => {
      prismaMock.taxClass.findUnique.mockResolvedValue({
        id: 'tc-def',
        isDefault: true,
        _count: { categories: 0, products: 0 },
      });

      await expect(service.remove('tc-def')).rejects.toThrow(BadRequestException);
    });

    it('should soft-deactivate if items are assigned', async () => {
      prismaMock.taxClass.findUnique.mockResolvedValue({
        id: 'tc-assigned',
        isDefault: false,
        _count: { categories: 2, products: 10 },
      });

      const res = await service.remove('tc-assigned');

      expect(prismaMock.taxClass.update).toHaveBeenCalledWith({
        where: { id: 'tc-assigned' },
        data: { isActive: false },
      });
      expect(res.success).toBe(true);
      expect(res.message).toContain('deactivated');
    });
  });
});
