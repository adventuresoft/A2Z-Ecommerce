import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { StockMovementType } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      inventory: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
    };
    service = new InventoryService(prismaMock);
  });

  describe('adjustStock', () => {
    it('should successfully restock an existing variant and create a StockMovement', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 20,
        reservedQuantity: 5,
        lowStockThreshold: 10,
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
          inventory: {
            update: vi.fn().mockResolvedValue({
              ...mockInventoryRow,
              quantity: 50,
            }),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({ id: 'mov-1' }),
          },
        };
        return cb(tx);
      });

      // Mock getVariantInventory return
      prismaMock.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 50,
        reservedQuantity: 5,
        lowStockThreshold: 10,
        updatedAt: new Date(),
        variant: {
          sku: 'SKU-001',
          barcode: null,
          productId: 'prod-1',
          product: { title: 'Test Product', category: { name: 'Category A' } },
          attributes: [],
        },
      });

      const result = await service.adjustStock(
        {
          variantId: 'var-1',
          type: StockMovementType.RESTOCK,
          quantityChange: 30,
          referenceId: 'PO-100',
          notes: 'Restock shipment',
        },
        'user-1',
      );

      expect(result.quantity).toBe(50);
      expect(result.availableQuantity).toBe(45);
      expect(result.isLowStock).toBe(false);
    });

    it('should throw BadRequestException when adjustment would cause negative physical stock', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 10,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
        };
        return cb(tx);
      });

      await expect(
        service.adjustStock(
          {
            variantId: 'var-1',
            type: StockMovementType.DAMAGED,
            quantityChange: -15,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when new physical stock is lower than committed reserved quantity', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 20,
        reservedQuantity: 15,
        lowStockThreshold: 5,
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
        };
        return cb(tx);
      });

      await expect(
        service.adjustStock(
          {
            variantId: 'var-1',
            type: StockMovementType.MANUAL_ADJUSTMENT,
            quantityChange: -10, // 20 - 10 = 10, but 15 is reserved!
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reserveStock', () => {
    it('should increment reservedQuantity when sufficient stock is available', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 10,
        reservedQuantity: 2,
      };

      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
        inventory: {
          update: vi.fn().mockResolvedValue({}),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      await service.reserveStock('var-1', 5, 'order-1', txMock as any);

      expect(txMock.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: { reservedQuantity: 7 },
      });
      expect(txMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: StockMovementType.PURCHASE_RESERVE,
            variantId: 'var-1',
            referenceId: 'order-1',
          }),
        }),
      );
    });

    it('should throw BadRequestException when available quantity is insufficient', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 10,
        reservedQuantity: 8, // available is 2
      };

      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
      };

      await expect(
        service.reserveStock('var-1', 5, 'order-1', txMock as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fulfillReservedStock', () => {
    it('should deduct both physical quantity and reserved quantity on order fulfillment', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 10,
        reservedQuantity: 3,
      };

      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
        inventory: {
          update: vi.fn().mockResolvedValue({}),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      await service.fulfillReservedStock('var-1', 3, 'order-1', txMock as any);

      expect(txMock.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: { quantity: 7, reservedQuantity: 0 },
      });
      expect(txMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: StockMovementType.ORDER_FULFILL,
            quantityChange: -3,
            previousQuantity: 10,
            newQuantity: 7,
          }),
        }),
      );
    });
  });

  describe('releaseReservedStock', () => {
    it('should decrement reserved quantity without changing physical quantity', async () => {
      const mockInventoryRow = {
        id: 'inv-1',
        variantId: 'var-1',
        quantity: 10,
        reservedQuantity: 4,
      };

      const txMock = {
        $queryRaw: vi.fn().mockResolvedValue([mockInventoryRow]),
        inventory: {
          update: vi.fn().mockResolvedValue({}),
        },
        stockMovement: {
          create: vi.fn().mockResolvedValue({}),
        },
      };

      await service.releaseReservedStock('var-1', 4, 'order-1', txMock as any);

      expect(txMock.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: { reservedQuantity: 0 },
      });
      expect(txMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: StockMovementType.CANCEL_RESTORE,
            referenceId: 'order-1',
          }),
        }),
      );
    });
  });
});
