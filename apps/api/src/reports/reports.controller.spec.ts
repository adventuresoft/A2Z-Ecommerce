import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsAdminController } from './reports.admin.controller.js';
import { ReportsService } from './reports.service.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

describe('ReportsAdminController', () => {
  let controller: ReportsAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getSalesSummary: vi.fn(),
      getSalesTimeline: vi.fn(),
      getSalesByPaymentMethod: vi.fn(),
      getSalesByOrderStatus: vi.fn(),
      getTopSellingProducts: vi.fn(),
      getSalesByCategory: vi.fn(),
      getSalesOrders: vi.fn(),
      exportSalesCsv: vi.fn(),
    };

    controller = new ReportsAdminController(serviceMock as ReportsService);
  });

  it('should delegate getSummary to service', async () => {
    const mockSummary = {
      grossSales: 50000,
      netSales: 48000,
      totalOrders: 20,
      paidOrdersCount: 18,
      pendingOrdersCount: 2,
      deliveredOrdersCount: 15,
      cancelledOrdersCount: 1,
      returnedOrdersCount: 0,
      totalDiscounts: 1000,
      totalShipping: 1200,
      totalRefunds: 2000,
      totalItemsSold: 45,
      averageOrderValue: 2500,
      currency: 'BDT',
    };
    serviceMock.getSalesSummary.mockResolvedValue(mockSummary);

    const query = { startDate: '2026-10-01', endDate: '2026-10-31' };
    const res = await controller.getSummary(query);

    expect(serviceMock.getSalesSummary).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockSummary);
  });

  it('should delegate getTimeline to service', async () => {
    const mockTimeline = {
      timeline: [
        {
          date: '2026-10-01',
          label: 'Oct 01, 2026',
          orderCount: 5,
          paidOrderCount: 4,
          grossSales: 15000,
          netSales: 15000,
          discounts: 500,
          shipping: 300,
          refunds: 0,
          itemsSold: 12,
        },
      ],
      interval: 'day',
    };
    serviceMock.getSalesTimeline.mockResolvedValue(mockTimeline);

    const query = { interval: 'day' as const };
    const res = await controller.getTimeline(query);

    expect(serviceMock.getSalesTimeline).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockTimeline);
  });

  it('should delegate getByPaymentMethod to service', async () => {
    const mockData = [
      {
        method: PaymentMethod.CASH_ON_DELIVERY,
        orderCount: 15,
        totalAmount: 35000,
        percentage: 70,
      },
    ];
    serviceMock.getSalesByPaymentMethod.mockResolvedValue(mockData);

    const res = await controller.getByPaymentMethod({});
    expect(serviceMock.getSalesByPaymentMethod).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getByOrderStatus to service', async () => {
    const mockData = [
      {
        status: OrderStatus.DELIVERED,
        orderCount: 10,
        totalAmount: 25000,
        percentage: 50,
      },
    ];
    serviceMock.getSalesByOrderStatus.mockResolvedValue(mockData);

    const res = await controller.getByOrderStatus({});
    expect(serviceMock.getSalesByOrderStatus).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getTopProducts to service with default limit', async () => {
    const mockData = [
      {
        variantId: 'v1',
        productId: 'p1',
        productTitle: 'Sneakers',
        sku: 'SNK-01',
        categoryName: 'Footwear',
        thumbnailUrl: null,
        quantitySold: 20,
        totalRevenue: 40000,
        averagePrice: 2000,
      },
    ];
    serviceMock.getTopSellingProducts.mockResolvedValue(mockData);

    const res = await controller.getTopProducts({});
    expect(serviceMock.getTopSellingProducts).toHaveBeenCalledWith({}, 10);
    expect(res).toEqual(mockData);
  });

  it('should delegate getByCategory to service', async () => {
    const mockData = [
      {
        categoryId: 'c1',
        categoryName: 'Electronics',
        orderCount: 12,
        quantitySold: 25,
        totalRevenue: 60000,
        percentage: 60,
      },
    ];
    serviceMock.getSalesByCategory.mockResolvedValue(mockData);

    const res = await controller.getByCategory({});
    expect(serviceMock.getSalesByCategory).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getSalesOrders to service', async () => {
    const mockData = {
      items: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 1,
    };
    serviceMock.getSalesOrders.mockResolvedValue(mockData);

    const res = await controller.getSalesOrders({ page: 1, limit: 15 });
    expect(serviceMock.getSalesOrders).toHaveBeenCalledWith({ page: 1, limit: 15 });
    expect(res).toEqual(mockData);
  });

  it('should stream CSV export with appropriate response headers', async () => {
    const csvContent = 'Order Number,Date,Total\n"AZ-01","2026-10-20","1000"';
    serviceMock.exportSalesCsv.mockResolvedValue(csvContent);

    const resMock = {
      attachment: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
    } as any;

    await controller.exportCsv({}, resMock);

    expect(serviceMock.exportSalesCsv).toHaveBeenCalled();
    expect(resMock.attachment).toHaveBeenCalledWith(expect.stringContaining('sales-report-'));
    expect(resMock.type).toHaveBeenCalledWith('text/csv');
    expect(resMock.send).toHaveBeenCalledWith(csvContent);
  });
});
