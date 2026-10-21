import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsInventoryAdminController } from './reports.inventory.admin.controller.js';
import { ReportsService } from './reports.service.js';
import { StockMovementType } from '@prisma/client';
import { InventoryStockStatusFilter } from './dto/index.js';

describe('ReportsInventoryAdminController', () => {
  let controller: ReportsInventoryAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getInventorySummary: vi.fn(),
      getInventoryTimeline: vi.fn(),
      getInventoryByStatus: vi.fn(),
      getInventoryByCategory: vi.fn(),
      getInventoryByBrand: vi.fn(),
      getInventoryMovementsByType: vi.fn(),
      getInventoryTopMovers: vi.fn(),
      getInventoryCriticalAlerts: vi.fn(),
      getInventoryList: vi.fn(),
      exportInventoryCsv: vi.fn(),
    };

    controller = new ReportsInventoryAdminController(
      serviceMock as ReportsService,
    );
  });

  it('should delegate getSummary to service', async () => {
    const mockSummary = {
      totalSkus: 80,
      totalProducts: 30,
      totalPhysicalUnits: 1500,
      totalReservedUnits: 50,
      totalAvailableUnits: 1450,
      totalValuationRegular: 2500000,
      totalValuationSelling: 2400000,
      potentialRevenue: 2300000,
      inStockCount: 65,
      inStockPercentage: 81.25,
      lowStockCount: 10,
      lowStockPercentage: 12.5,
      outOfStockCount: 5,
      outOfStockPercentage: 6.25,
      averageUnitValue: 1666.67,
      currency: 'BDT',
    };
    serviceMock.getInventorySummary.mockResolvedValue(mockSummary);

    const query = { stockStatus: InventoryStockStatusFilter.ALL };
    const res = await controller.getSummary(query);

    expect(serviceMock.getInventorySummary).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockSummary);
  });

  it('should delegate getTimeline to service', async () => {
    const mockTimeline = {
      timeline: [
        {
          date: '2026-10-15',
          label: 'Oct 15',
          inflowUnits: 100,
          outflowUnits: 30,
          netChange: 70,
          adjustmentsUnits: 0,
          movementEventsCount: 12,
        },
      ],
      interval: 'day',
    };
    serviceMock.getInventoryTimeline.mockResolvedValue(mockTimeline);

    const query = { interval: 'day' as const };
    const res = await controller.getTimeline(query);

    expect(serviceMock.getInventoryTimeline).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockTimeline);
  });

  it('should delegate getByStatus to service', async () => {
    const mockBreakdown = [
      {
        status: 'IN_STOCK' as const,
        count: 65,
        percentage: 81.25,
        totalUnits: 1400,
        totalValuation: 2300000,
      },
    ];
    serviceMock.getInventoryByStatus.mockResolvedValue(mockBreakdown);

    const res = await controller.getByStatus({});
    expect(serviceMock.getInventoryByStatus).toHaveBeenCalled();
    expect(res).toEqual(mockBreakdown);
  });

  it('should delegate getByCategory to service', async () => {
    const mockCategories = [
      {
        categoryId: 'cat-1',
        categoryName: 'Electronics',
        skuCount: 20,
        totalUnits: 400,
        availableUnits: 380,
        reservedUnits: 20,
        totalValuation: 1000000,
        percentage: 40,
      },
    ];
    serviceMock.getInventoryByCategory.mockResolvedValue(mockCategories);

    const res = await controller.getByCategory({});
    expect(serviceMock.getInventoryByCategory).toHaveBeenCalled();
    expect(res).toEqual(mockCategories);
  });

  it('should delegate getByBrand to service', async () => {
    const mockBrands = [
      {
        brandId: 'brand-1',
        brandName: 'Apple',
        skuCount: 15,
        totalUnits: 300,
        availableUnits: 290,
        reservedUnits: 10,
        totalValuation: 800000,
        percentage: 32,
      },
    ];
    serviceMock.getInventoryByBrand.mockResolvedValue(mockBrands);

    const res = await controller.getByBrand({});
    expect(serviceMock.getInventoryByBrand).toHaveBeenCalled();
    expect(res).toEqual(mockBrands);
  });

  it('should delegate getMovementsByType to service', async () => {
    const mockMovements = [
      {
        type: StockMovementType.RESTOCK,
        count: 10,
        quantityIn: 500,
        quantityOut: 0,
        netQuantity: 500,
      },
    ];
    serviceMock.getInventoryMovementsByType.mockResolvedValue(mockMovements);

    const res = await controller.getMovementsByType({});
    expect(serviceMock.getInventoryMovementsByType).toHaveBeenCalled();
    expect(res).toEqual(mockMovements);
  });

  it('should delegate getTopMovers to service with limit', async () => {
    const mockTopMovers = [
      {
        variantId: 'v-1',
        sku: 'IPHONE-15',
        productTitle: 'iPhone 15',
        categoryName: 'Phones',
        currentQuantity: 25,
        unitsDeducted: 80,
        movementCount: 14,
      },
    ];
    serviceMock.getInventoryTopMovers.mockResolvedValue(mockTopMovers);

    const res = await controller.getTopMovers({ limit: 5 });
    expect(serviceMock.getInventoryTopMovers).toHaveBeenCalledWith(
      { limit: 5 },
      5,
    );
    expect(res).toEqual(mockTopMovers);
  });

  it('should delegate getCriticalAlerts to service with limit', async () => {
    const mockAlerts = [
      {
        variantId: 'v-2',
        sku: 'LOW-ITEM',
        productTitle: 'Low Item',
        categoryName: 'General',
        quantity: 2,
        reservedQuantity: 1,
        availableQuantity: 1,
        lowStockThreshold: 5,
        deficit: 4,
        status: 'LOW_STOCK' as const,
      },
    ];
    serviceMock.getInventoryCriticalAlerts.mockResolvedValue(mockAlerts);

    const res = await controller.getCriticalAlerts({ limit: 10 });
    expect(serviceMock.getInventoryCriticalAlerts).toHaveBeenCalledWith(
      { limit: 10 },
      10,
    );
    expect(res).toEqual(mockAlerts);
  });

  it('should delegate getInventoryList to service', async () => {
    const mockList = {
      items: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 0,
    };
    serviceMock.getInventoryList.mockResolvedValue(mockList);

    const query = { page: 1, limit: 15 };
    const res = await controller.getInventoryList(query);
    expect(serviceMock.getInventoryList).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockList);
  });

  it('should delegate exportCsv to service and send headers', async () => {
    const csvContent = 'SKU,Product Title\r\n"IPH15","iPhone 15"';
    serviceMock.exportInventoryCsv.mockResolvedValue(csvContent);

    const resMock = {
      attachment: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
    } as any;

    await controller.exportCsv({}, resMock);

    expect(serviceMock.exportInventoryCsv).toHaveBeenCalled();
    expect(resMock.attachment).toHaveBeenCalled();
    expect(resMock.type).toHaveBeenCalledWith('text/csv');
    expect(resMock.send).toHaveBeenCalledWith(csvContent);
  });
});
