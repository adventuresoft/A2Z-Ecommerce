import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsCustomerAdminController } from './reports.customer.admin.controller.js';
import { ReportsService } from './reports.service.js';
import { CustomerSpendingTier, CustomerStatusFilter } from './dto/index.js';

describe('ReportsCustomerAdminController', () => {
  let controller: ReportsCustomerAdminController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getCustomerSummary: vi.fn(),
      getCustomerTimeline: vi.fn(),
      getCustomerSegments: vi.fn(),
      getCustomerByCity: vi.fn(),
      getTopCustomers: vi.fn(),
      getCustomerList: vi.fn(),
      exportCustomerCsv: vi.fn(),
    };

    controller = new ReportsCustomerAdminController(
      serviceMock as ReportsService,
    );
  });

  it('should delegate getSummary to service', async () => {
    const mockSummary = {
      totalCustomers: 150,
      newCustomers: 25,
      activeCustomers: 80,
      purchasingCustomers: 80,
      repeatCustomers: 35,
      repeatCustomerRate: 43.75,
      totalOrders: 180,
      totalRevenue: 450000,
      averageCustomerValue: 5625,
      averageOrdersPerCustomer: 2.25,
      zeroOrderCustomers: 40,
      inactiveCustomersCount: 5,
      currency: 'BDT',
    };
    serviceMock.getCustomerSummary.mockResolvedValue(mockSummary);

    const query = { customerStatus: CustomerStatusFilter.ALL };
    const res = await controller.getSummary(query);

    expect(serviceMock.getCustomerSummary).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockSummary);
  });

  it('should delegate getTimeline to service', async () => {
    const mockTimeline = {
      timeline: [
        {
          date: '2026-10-15',
          label: 'Oct 15',
          newRegistrations: 4,
          purchasingCustomers: 10,
          ordersPlaced: 15,
          revenue: 35000,
        },
      ],
      interval: 'day',
    };
    serviceMock.getCustomerTimeline.mockResolvedValue(mockTimeline);

    const query = { interval: 'day' as const };
    const res = await controller.getTimeline(query);

    expect(serviceMock.getCustomerTimeline).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockTimeline);
  });

  it('should delegate getBySegment to service', async () => {
    const mockSegments = [
      {
        segment: 'VIP',
        label: 'VIP (> ৳10,000)',
        customerCount: 15,
        percentage: 10,
        totalRevenue: 250000,
        averageSpent: 16666.67,
      },
      {
        segment: 'REGULAR',
        label: 'Repeat Customer (2+ Orders)',
        customerCount: 40,
        percentage: 26.67,
        totalRevenue: 150000,
        averageSpent: 3750,
      },
      {
        segment: 'ONE_TIME',
        label: 'One-Time Buyer (1 Order)',
        customerCount: 55,
        percentage: 36.67,
        totalRevenue: 50000,
        averageSpent: 909.09,
      },
      {
        segment: 'ZERO_ORDER',
        label: 'Zero Orders / Inactive',
        customerCount: 40,
        percentage: 26.67,
        totalRevenue: 0,
        averageSpent: 0,
      },
    ];
    serviceMock.getCustomerSegments.mockResolvedValue(mockSegments);

    const query = {};
    const res = await controller.getBySegment(query);

    expect(serviceMock.getCustomerSegments).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockSegments);
  });

  it('should delegate getByCity to service with default or custom limit', async () => {
    const mockCities = [
      {
        city: 'Dhaka',
        customerCount: 45,
        orderCount: 95,
        totalRevenue: 280000,
        percentage: 56.25,
      },
    ];
    serviceMock.getCustomerByCity.mockResolvedValue(mockCities);

    const query = { limit: 5 };
    const res = await controller.getByCity(query);

    expect(serviceMock.getCustomerByCity).toHaveBeenCalledWith(query, 5);
    expect(res).toEqual(mockCities);
  });

  it('should delegate getTopCustomers to service', async () => {
    const mockTop = [
      {
        id: 'usr-1',
        name: 'Top Spender',
        email: 'spender@example.com',
        phone: '+8801711111111',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        ordersCount: 10,
        totalSpent: 45000,
        averageOrderValue: 4500,
        lastOrderDate: '2026-10-18T10:00:00.000Z',
        primaryCity: 'Dhaka',
      },
    ];
    serviceMock.getTopCustomers.mockResolvedValue(mockTop);

    const query = { limit: 10 };
    const res = await controller.getTopCustomers(query);

    expect(serviceMock.getTopCustomers).toHaveBeenCalledWith(query, 10);
    expect(res).toEqual(mockTop);
  });

  it('should delegate getCustomerList to service', async () => {
    const mockList = {
      items: [
        {
          id: 'usr-1',
          name: 'Rahim Chowdhury',
          email: 'rahim@example.com',
          phone: '+8801700000000',
          isActive: true,
          createdAt: '2026-02-15T00:00:00.000Z',
          ordersCount: 5,
          deliveredOrdersCount: 4,
          cancelledOrdersCount: 0,
          totalSpent: 22000,
          averageOrderValue: 4400,
          lastOrderDate: '2026-10-15T00:00:00.000Z',
          primaryCity: 'Dhaka',
          reviewsCount: 2,
          spendingTier: CustomerSpendingTier.VIP,
        },
      ],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    };
    serviceMock.getCustomerList.mockResolvedValue(mockList);

    const query = { page: 1, limit: 15 };
    const res = await controller.getCustomerList(query);

    expect(serviceMock.getCustomerList).toHaveBeenCalledWith(query);
    expect(res).toEqual(mockList);
  });

  it('should delegate exportCsv to service and set response headers', async () => {
    const csvContent = 'Customer ID,Name,Email\r\n"usr-1","Test","test@example.com"';
    serviceMock.exportCustomerCsv.mockResolvedValue(csvContent);

    const query = {};
    const resMock: any = {
      attachment: vi.fn(),
      type: vi.fn(),
      send: vi.fn(),
    };

    await controller.exportCsv(query, resMock);

    expect(serviceMock.exportCustomerCsv).toHaveBeenCalledWith(query);
    expect(resMock.attachment).toHaveBeenCalled();
    expect(resMock.type).toHaveBeenCalledWith('text/csv');
    expect(resMock.send).toHaveBeenCalledWith(csvContent);
  });
});
