import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryAdminController } from './inventory.admin.controller.js';
import { StockMovementType } from '@prisma/client';

describe('InventoryAdminController', () => {
  let controller: InventoryAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getInventoryOverview: vi.fn(),
      getLowStockAlerts: vi.fn(),
      getStockMovements: vi.fn(),
      getVariantInventory: vi.fn(),
      adjustStock: vi.fn(),
      updateThreshold: vi.fn(),
    };

    controller = new InventoryAdminController(serviceMock);
  });

  it('should get paginated inventory overview', async () => {
    const query = { page: 1, limit: 10, search: 'shirt' };
    const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
    serviceMock.getInventoryOverview.mockResolvedValueOnce(expected);

    const result = await controller.getOverview(query);
    expect(result).toEqual(expected);
    expect(serviceMock.getInventoryOverview).toHaveBeenCalledWith(query);
  });

  it('should get low stock alerts', async () => {
    const expected = { totalVariants: 10, lowStockCount: 2, outOfStockCount: 1, items: [] };
    serviceMock.getLowStockAlerts.mockResolvedValueOnce(expected);

    const result = await controller.getLowStock(20);
    expect(result).toEqual(expected);
    expect(serviceMock.getLowStockAlerts).toHaveBeenCalledWith(20);
  });

  it('should get movements ledger', async () => {
    const query = { page: 1, limit: 20 };
    const expected = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } };
    serviceMock.getStockMovements.mockResolvedValueOnce(expected);

    const result = await controller.getMovements(query);
    expect(result).toEqual(expected);
    expect(serviceMock.getStockMovements).toHaveBeenCalledWith(query);
  });

  it('should adjust stock passing current user id', async () => {
    const dto = {
      variantId: 'var-1',
      type: StockMovementType.RESTOCK,
      quantityChange: 50,
    };
    const user = { sub: 'user-admin-1', email: 'admin@a2z.com', role: 'ADMIN' as any };
    const expected = { id: 'inv-1', variantId: 'var-1', quantity: 50 };
    serviceMock.adjustStock.mockResolvedValueOnce(expected);

    const result = await controller.adjustStock(dto, user);
    expect(result).toEqual(expected);
    expect(serviceMock.adjustStock).toHaveBeenCalledWith(dto, 'user-admin-1');
  });

  it('should update low stock threshold', async () => {
    const expected = { id: 'inv-1', variantId: 'var-1', lowStockThreshold: 15 };
    serviceMock.updateThreshold.mockResolvedValueOnce(expected);

    const result = await controller.updateThreshold('var-1', { lowStockThreshold: 15 });
    expect(result).toEqual(expected);
    expect(serviceMock.updateThreshold).toHaveBeenCalledWith('var-1', 15);
  });
});
