import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsOrdersAdminController } from './reports.orders.admin.controller.js';
import { ReportsService } from './reports.service.js';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

describe('ReportsOrdersAdminController', () => {
  let controller: ReportsOrdersAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getOrdersSummary: vi.fn(),
      getOrdersTimeline: vi.fn(),
      getOrdersByStatus: vi.fn(),
      getOrdersByShipmentStatus: vi.fn(),
      getOrdersByPaymentStatus: vi.fn(),
      getOrdersByShippingCity: vi.fn(),
      getOrdersByShippingMethod: vi.fn(),
      getOrdersList: vi.fn(),
      exportOrdersCsv: vi.fn(),
    };

    controller = new ReportsOrdersAdminController(
      serviceMock as ReportsService,
    );
  });

  it('should delegate getSummary to service', async () => {
    const mockSummary = {
      totalOrders: 50,
      totalOrderValue: 120000,
      averageOrderValue: 2400,
      totalItemsOrdered: 130,
      averageItemsPerOrder: 2.6,
      pendingOrdersCount: 5,
      confirmedOrdersCount: 10,
      processingOrdersCount: 8,
      shippedOrdersCount: 12,
      deliveredOrdersCount: 15,
      cancelledOrdersCount: 0,
      returnedOrdersCount: 0,
      fulfillmentRate: 30,
      cancellationRate: 0,
      returnRate: 0,
      paidOrdersCount: 35,
      pendingPaymentCount: 15,
      failedPaymentCount: 0,
      refundedOrdersCount: 0,
      currency: 'BDT',
    };
    serviceMock.getOrdersSummary.mockResolvedValue(mockSummary);

    const query = { startDate: '2026-10-01', endDate: '2026-10-31' };
    const res = await controller.getSummary(query);

    expect(serviceMock.getOrdersSummary).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockSummary);
  });

  it('should delegate getTimeline to service', async () => {
    const mockTimeline = {
      timeline: [
        {
          date: '2026-10-15',
          label: 'Oct 15, 2026',
          totalOrders: 10,
          deliveredOrders: 4,
          processingOrders: 5,
          cancelledOrders: 1,
          returnedOrders: 0,
          totalValue: 25000,
          itemsCount: 22,
        },
      ],
      interval: 'day',
    };
    serviceMock.getOrdersTimeline.mockResolvedValue(mockTimeline);

    const query = { interval: 'day' as const };
    const res = await controller.getTimeline(query);

    expect(serviceMock.getOrdersTimeline).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockTimeline);
  });

  it('should delegate getByStatus to service', async () => {
    const mockData = [
      {
        status: OrderStatus.DELIVERED,
        count: 20,
        percentage: 40,
        totalAmount: 50000,
        averageAmount: 2500,
      },
    ];
    serviceMock.getOrdersByStatus.mockResolvedValue(mockData);

    const res = await controller.getByStatus({});
    expect(serviceMock.getOrdersByStatus).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getByShipmentStatus to service', async () => {
    const mockData = [
      {
        status: ShipmentStatus.DELIVERED,
        count: 15,
        percentage: 30,
        totalAmount: 40000,
      },
    ];
    serviceMock.getOrdersByShipmentStatus.mockResolvedValue(mockData);

    const res = await controller.getByShipmentStatus({});
    expect(serviceMock.getOrdersByShipmentStatus).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getByPaymentStatus to service', async () => {
    const mockData = [
      {
        status: PaymentStatus.PAID,
        count: 40,
        percentage: 80,
        totalAmount: 95000,
      },
    ];
    serviceMock.getOrdersByPaymentStatus.mockResolvedValue(mockData);

    const res = await controller.getByPaymentStatus({});
    expect(serviceMock.getOrdersByPaymentStatus).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getByShippingCity to service with limit', async () => {
    const mockData = [
      {
        city: 'Dhaka',
        count: 30,
        percentage: 60,
        totalAmount: 75000,
      },
    ];
    serviceMock.getOrdersByShippingCity.mockResolvedValue(mockData);

    const res = await controller.getByShippingCity({ limit: 5 });
    expect(serviceMock.getOrdersByShippingCity).toHaveBeenCalledWith(
      { limit: 5 },
      5,
    );
    expect(res).toEqual(mockData);
  });

  it('should delegate getByShippingMethod to service', async () => {
    const mockData = [
      {
        methodName: 'Standard Courier',
        zoneName: 'Inside Dhaka',
        count: 25,
        percentage: 50,
        totalShippingFee: 2000,
      },
    ];
    serviceMock.getOrdersByShippingMethod.mockResolvedValue(mockData);

    const res = await controller.getByShippingMethod({});
    expect(serviceMock.getOrdersByShippingMethod).toHaveBeenCalled();
    expect(res).toEqual(mockData);
  });

  it('should delegate getOrdersList to service', async () => {
    const mockData = {
      items: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 1,
    };
    serviceMock.getOrdersList.mockResolvedValue(mockData);

    const res = await controller.getOrdersList({ page: 1, limit: 15 });
    expect(serviceMock.getOrdersList).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
    });
    expect(res).toEqual(mockData);
  });

  it('should stream CSV export with appropriate response headers', async () => {
    const csvContent =
      'Order Number,Date,Customer,Total\n"ORD-01","2026-10-21","Rahim","2500"';
    serviceMock.exportOrdersCsv.mockResolvedValue(csvContent);

    const resMock = {
      attachment: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
    } as any;

    await controller.exportCsv({}, resMock);

    expect(serviceMock.exportOrdersCsv).toHaveBeenCalled();
    expect(resMock.attachment).toHaveBeenCalledWith(
      expect.stringContaining('orders-report-'),
    );
    expect(resMock.type).toHaveBeenCalledWith('text/csv');
    expect(resMock.send).toHaveBeenCalledWith(csvContent);
  });
});
