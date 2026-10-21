import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsService } from './reports.service.js';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      storeSetting: {
        findUnique: vi.fn().mockResolvedValue({ key: 'store_currency', value: 'BDT' }),
      },
      order: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      orderItem: {
        findMany: vi.fn(),
      },
    };

    service = new ReportsService(prismaMock);
  });

  describe('getSalesSummary', () => {
    it('should aggregate sales summary metrics accurately from orders and refunds', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          grandTotal: '5000.00',
          subtotal: '4800.00',
          discountAmount: '300.00',
          shippingFee: '500.00',
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          refunds: [{ amount: '500.00', status: 'COMPLETED' }],
          items: [{ quantity: 2 }, { quantity: 1 }],
        },
        {
          id: 'ord-2',
          grandTotal: '2500.00',
          subtotal: '2400.00',
          discountAmount: '0.00',
          shippingFee: '100.00',
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          refunds: [],
          items: [{ quantity: 1 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const summary = await service.getSalesSummary({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(summary.totalOrders).toBe(2);
      expect(summary.grossSales).toBe(7500);
      expect(summary.totalRefunds).toBe(500);
      expect(summary.netSales).toBe(7000);
      expect(summary.paidOrdersCount).toBe(1);
      expect(summary.pendingOrdersCount).toBe(1);
      expect(summary.deliveredOrdersCount).toBe(1);
      expect(summary.totalDiscounts).toBe(300);
      expect(summary.totalShipping).toBe(600);
      expect(summary.totalItemsSold).toBe(4);
      expect(summary.averageOrderValue).toBe(3750);
      expect(summary.currency).toBe('BDT');
    });

    it('should handle zero matching orders gracefully with 0 totals', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const summary = await service.getSalesSummary({});

      expect(summary.totalOrders).toBe(0);
      expect(summary.grossSales).toBe(0);
      expect(summary.netSales).toBe(0);
      expect(summary.averageOrderValue).toBe(0);
      expect(summary.totalItemsSold).toBe(0);
    });
  });

  describe('getSalesTimeline', () => {
    it('should group orders into daily timeline buckets', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          createdAt: new Date('2026-10-15T10:00:00Z'),
          grandTotal: '3000.00',
          discountAmount: '100.00',
          shippingFee: '150.00',
          paymentStatus: PaymentStatus.PAID,
          refunds: [],
          items: [{ quantity: 2 }],
        },
        {
          id: 'ord-2',
          createdAt: new Date('2026-10-15T14:30:00Z'),
          grandTotal: '2000.00',
          discountAmount: '50.00',
          shippingFee: '100.00',
          paymentStatus: PaymentStatus.PAID,
          refunds: [{ amount: '200.00', status: 'COMPLETED' }],
          items: [{ quantity: 1 }],
        },
        {
          id: 'ord-3',
          createdAt: new Date('2026-10-16T09:15:00Z'),
          grandTotal: '1500.00',
          discountAmount: '0.00',
          shippingFee: '50.00',
          paymentStatus: PaymentStatus.PENDING,
          refunds: [],
          items: [{ quantity: 1 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getSalesTimeline({ interval: 'day' });

      expect(res.timeline.length).toBe(2);
      expect(res.timeline[0].date).toBe('2026-10-15');
      expect(res.timeline[0].orderCount).toBe(2);
      expect(res.timeline[0].grossSales).toBe(5000);
      expect(res.timeline[0].netSales).toBe(4800);
      expect(res.timeline[0].refunds).toBe(200);
      expect(res.timeline[0].itemsSold).toBe(3);

      expect(res.timeline[1].date).toBe('2026-10-16');
      expect(res.timeline[1].orderCount).toBe(1);
      expect(res.timeline[1].grossSales).toBe(1500);
    });

    it('should group orders into monthly timeline buckets when interval is month', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          createdAt: new Date('2026-09-10T10:00:00Z'),
          grandTotal: '4000.00',
          discountAmount: '0.00',
          shippingFee: '100.00',
          paymentStatus: PaymentStatus.PAID,
          refunds: [],
          items: [{ quantity: 1 }],
        },
        {
          id: 'ord-2',
          createdAt: new Date('2026-10-05T12:00:00Z'),
          grandTotal: '6000.00',
          discountAmount: '0.00',
          shippingFee: '100.00',
          paymentStatus: PaymentStatus.PAID,
          refunds: [],
          items: [{ quantity: 2 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getSalesTimeline({ interval: 'month' });

      expect(res.timeline.length).toBe(2);
      expect(res.timeline[0].date).toBe('2026-09');
      expect(res.timeline[1].date).toBe('2026-10');
    });
  });

  describe('getSalesByPaymentMethod', () => {
    it('should aggregate volume and percentages across payment methods', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          grandTotal: '6000.00',
          payments: [{ method: PaymentMethod.CASH_ON_DELIVERY }],
        },
        {
          id: 'ord-2',
          grandTotal: '4000.00',
          payments: [{ method: PaymentMethod.MOBILE_BANKING }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getSalesByPaymentMethod({});

      expect(res.length).toBe(3);
      const cod = res.find((r) => r.method === PaymentMethod.CASH_ON_DELIVERY);
      const mb = res.find((r) => r.method === PaymentMethod.MOBILE_BANKING);

      expect(cod?.orderCount).toBe(1);
      expect(cod?.totalAmount).toBe(6000);
      expect(cod?.percentage).toBe(60);

      expect(mb?.orderCount).toBe(1);
      expect(mb?.totalAmount).toBe(4000);
      expect(mb?.percentage).toBe(40);
    });
  });

  describe('getSalesByOrderStatus', () => {
    it('should aggregate counts and amounts across order statuses', async () => {
      const mockOrders = [
        { id: 'ord-1', orderStatus: OrderStatus.DELIVERED, grandTotal: '1000.00' },
        { id: 'ord-2', orderStatus: OrderStatus.DELIVERED, grandTotal: '2000.00' },
        { id: 'ord-3', orderStatus: OrderStatus.CONFIRMED, grandTotal: '1500.00' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getSalesByOrderStatus({});

      const delivered = res.find((r) => r.status === OrderStatus.DELIVERED);
      const confirmed = res.find((r) => r.status === OrderStatus.CONFIRMED);

      expect(delivered?.orderCount).toBe(2);
      expect(delivered?.totalAmount).toBe(3000);
      expect(confirmed?.orderCount).toBe(1);
      expect(confirmed?.totalAmount).toBe(1500);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should aggregate quantities and revenue by product variant and rank descending', async () => {
      const mockItems = [
        {
          variantId: 'var-1',
          productTitle: 'iPhone 15 Pro',
          sku: 'APL-IPH15P-128',
          quantity: 2,
          totalPrice: '260000.00',
          variant: {
            productId: 'prod-1',
            imageUrl: null,
            image: null,
            product: {
              thumbnailUrl: 'https://example.com/thumb.jpg',
              category: { name: 'Smartphones' },
            },
          },
        },
        {
          variantId: 'var-1',
          productTitle: 'iPhone 15 Pro',
          sku: 'APL-IPH15P-128',
          quantity: 1,
          totalPrice: '130000.00',
          variant: {
            productId: 'prod-1',
            imageUrl: null,
            image: null,
            product: {
              thumbnailUrl: 'https://example.com/thumb.jpg',
              category: { name: 'Smartphones' },
            },
          },
        },
        {
          variantId: 'var-2',
          productTitle: 'AirPods Pro 2',
          sku: 'APL-AIRPODS-P2',
          quantity: 5,
          totalPrice: '125000.00',
          variant: {
            productId: 'prod-2',
            imageUrl: null,
            image: null,
            product: {
              thumbnailUrl: null,
              category: { name: 'Audio' },
            },
          },
        },
      ];

      prismaMock.orderItem.findMany.mockResolvedValue(mockItems);

      const res = await service.getTopSellingProducts({}, 10);

      expect(res.length).toBe(2);
      expect(res[0].sku).toBe('APL-IPH15P-128');
      expect(res[0].quantitySold).toBe(3);
      expect(res[0].totalRevenue).toBe(390000);
      expect(res[0].categoryName).toBe('Smartphones');

      expect(res[1].sku).toBe('APL-AIRPODS-P2');
      expect(res[1].quantitySold).toBe(5);
      expect(res[1].totalRevenue).toBe(125000);
    });
  });

  describe('getSalesByCategory', () => {
    it('should aggregate units sold and revenue contribution by category', async () => {
      const mockItems = [
        {
          order: { id: 'ord-1' },
          quantity: 2,
          totalPrice: '5000.00',
          variant: {
            product: {
              category: { id: 'cat-1', name: 'Electronics' },
            },
          },
        },
        {
          order: { id: 'ord-2' },
          quantity: 3,
          totalPrice: '5000.00',
          variant: {
            product: {
              category: { id: 'cat-2', name: 'Apparel' },
            },
          },
        },
      ];

      prismaMock.orderItem.findMany.mockResolvedValue(mockItems);

      const res = await service.getSalesByCategory({});

      expect(res.length).toBe(2);
      expect(res[0].totalRevenue).toBe(5000);
      expect(res[0].percentage).toBe(50);
      expect(res[1].totalRevenue).toBe(5000);
      expect(res[1].percentage).toBe(50);
    });
  });

  describe('getSalesOrders', () => {
    it('should return paginated order records with net calculation', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          orderNumber: 'AZ-2026-0001',
          recipientName: 'Alice Rahman',
          recipientPhone: '01700000001',
          createdAt: new Date('2026-10-20T10:00:00Z'),
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          shipmentStatus: 'DELIVERED',
          grandTotal: '3500.00',
          subtotal: '3300.00',
          discountAmount: '0.00',
          shippingFee: '200.00',
          user: { name: 'Alice Rahman', email: 'alice@example.com' },
          payments: [{ method: PaymentMethod.CASH_ON_DELIVERY }],
          refunds: [{ amount: '500.00', status: 'COMPLETED' }],
          items: [
            {
              id: 'it-1',
              productTitle: 'Sneakers',
              sku: 'SNK-01',
              variantAttributes: 'Size: 42',
              unitPrice: '1650.00',
              quantity: 2,
              totalPrice: '3300.00',
            },
          ],
        },
      ];

      prismaMock.order.count.mockResolvedValue(1);
      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getSalesOrders({ page: 1, limit: 10 });

      expect(res.total).toBe(1);
      expect(res.items.length).toBe(1);
      expect(res.items[0].orderNumber).toBe('AZ-2026-0001');
      expect(res.items[0].grandTotal).toBe(3500);
      expect(res.items[0].refundAmount).toBe(500);
      expect(res.items[0].netAmount).toBe(3000);
      expect(res.items[0].itemsCount).toBe(2);
    });
  });

  describe('exportSalesCsv', () => {
    it('should generate properly formatted CSV string with headers and escaped values', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          orderNumber: 'AZ-2026-0001',
          recipientName: 'Alice "Pro" Rahman',
          recipientPhone: '01700000001',
          createdAt: new Date('2026-10-20T10:00:00Z'),
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          shipmentStatus: 'DELIVERED',
          grandTotal: '3500.00',
          subtotal: '3300.00',
          discountAmount: '0.00',
          shippingFee: '200.00',
          user: { name: 'Alice Rahman', email: 'alice@example.com' },
          payments: [{ method: PaymentMethod.CASH_ON_DELIVERY }],
          refunds: [],
          items: [{ quantity: 2 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const csv = await service.exportSalesCsv({});

      expect(csv).toContain('Order Number,Order Date,Customer Name');
      expect(csv).toContain('"AZ-2026-0001"');
      expect(csv).toContain('"Alice ""Pro"" Rahman"');
      expect(csv).toContain('"3500.00"');
    });
  });

  describe('getOrdersSummary', () => {
    it('should aggregate order volume, fulfillment rates, and basket size correctly', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          grandTotal: '3000.00',
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          items: [{ quantity: 3 }],
        },
        {
          id: 'ord-2',
          grandTotal: '1500.00',
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: [{ quantity: 1 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const summary = await service.getOrdersSummary({});

      expect(summary.totalOrders).toBe(2);
      expect(summary.totalOrderValue).toBe(4500);
      expect(summary.averageOrderValue).toBe(2250);
      expect(summary.totalItemsOrdered).toBe(4);
      expect(summary.averageItemsPerOrder).toBe(2);
      expect(summary.deliveredOrdersCount).toBe(1);
      expect(summary.pendingOrdersCount).toBe(1);
      expect(summary.fulfillmentRate).toBe(50);
      expect(summary.paidOrdersCount).toBe(1);
      expect(summary.pendingPaymentCount).toBe(1);
      expect(summary.currency).toBe('BDT');
    });

    it('should handle empty orders list gracefully with 0 counts', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const summary = await service.getOrdersSummary({});

      expect(summary.totalOrders).toBe(0);
      expect(summary.totalOrderValue).toBe(0);
      expect(summary.averageOrderValue).toBe(0);
      expect(summary.fulfillmentRate).toBe(0);
    });
  });

  describe('getOrdersTimeline', () => {
    it('should bucket orders by timeline interval correctly', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          createdAt: new Date('2026-10-21T08:00:00Z'),
          grandTotal: '2000.00',
          orderStatus: OrderStatus.DELIVERED,
          items: [{ quantity: 2 }],
        },
        {
          id: 'ord-2',
          createdAt: new Date('2026-10-21T12:00:00Z'),
          grandTotal: '1500.00',
          orderStatus: OrderStatus.CANCELLED,
          items: [{ quantity: 1 }],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersTimeline({ interval: 'day' });

      expect(res.timeline.length).toBe(1);
      expect(res.timeline[0].totalOrders).toBe(2);
      expect(res.timeline[0].deliveredOrders).toBe(1);
      expect(res.timeline[0].cancelledOrders).toBe(1);
      expect(res.timeline[0].totalValue).toBe(3500);
      expect(res.timeline[0].itemsCount).toBe(3);
    });
  });

  describe('getOrdersByStatus', () => {
    it('should calculate percentages and totals across all OrderStatus values', async () => {
      const mockOrders = [
        { orderStatus: OrderStatus.DELIVERED, grandTotal: '4000.00' },
        { orderStatus: OrderStatus.DELIVERED, grandTotal: '2000.00' },
        { orderStatus: OrderStatus.PENDING, grandTotal: '1000.00' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersByStatus({});

      const delivered = res.find((s) => s.status === OrderStatus.DELIVERED);
      const pending = res.find((s) => s.status === OrderStatus.PENDING);

      expect(delivered?.count).toBe(2);
      expect(delivered?.totalAmount).toBe(6000);
      expect(delivered?.percentage).toBe(66.67);
      expect(pending?.count).toBe(1);
      expect(pending?.percentage).toBe(33.33);
    });
  });

  describe('getOrdersByShipmentStatus', () => {
    it('should aggregate orders across ShipmentStatus enums', async () => {
      const mockOrders = [
        { shipmentStatus: ShipmentStatus.DELIVERED, grandTotal: '5000.00' },
        { shipmentStatus: ShipmentStatus.IN_TRANSIT, grandTotal: '3000.00' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersByShipmentStatus({});

      const delivered = res.find((s) => s.status === ShipmentStatus.DELIVERED);
      expect(delivered?.count).toBe(1);
      expect(delivered?.percentage).toBe(50);
      expect(delivered?.totalAmount).toBe(5000);
    });
  });

  describe('getOrdersByPaymentStatus', () => {
    it('should aggregate orders across PaymentStatus enums', async () => {
      const mockOrders = [
        { paymentStatus: PaymentStatus.PAID, grandTotal: '8000.00' },
        { paymentStatus: PaymentStatus.PENDING, grandTotal: '2000.00' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersByPaymentStatus({});

      const paid = res.find((s) => s.status === PaymentStatus.PAID);
      expect(paid?.count).toBe(1);
      expect(paid?.percentage).toBe(50);
      expect(paid?.totalAmount).toBe(8000);
    });
  });

  describe('getOrdersByShippingCity', () => {
    it('should group orders by city and return top cities sorted by volume', async () => {
      const mockOrders = [
        { shippingCity: 'Dhaka', grandTotal: '3000.00' },
        { shippingCity: 'dhaka', grandTotal: '2000.00' },
        { shippingCity: 'Chittagong', grandTotal: '1500.00' },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersByShippingCity({}, 5);

      expect(res.length).toBe(2);
      expect(res[0].city).toBe('Dhaka');
      expect(res[0].count).toBe(2);
      expect(res[0].totalAmount).toBe(5000);
      expect(res[1].city).toBe('Chittagong');
      expect(res[1].count).toBe(1);
    });
  });

  describe('getOrdersByShippingMethod', () => {
    it('should group orders by shipping method and zone', async () => {
      const mockOrders = [
        {
          shippingFee: '100.00',
          shipments: [
            {
              courierName: 'RedX',
              shippingMethod: { name: 'Standard Delivery', zone: { name: 'Dhaka City' } },
            },
          ],
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const res = await service.getOrdersByShippingMethod({});

      expect(res.length).toBe(1);
      expect(res[0].methodName).toBe('Standard Delivery');
      expect(res[0].zoneName).toBe('Dhaka City');
      expect(res[0].count).toBe(1);
      expect(res[0].totalShippingFee).toBe(100);
    });
  });

  describe('getOrdersList', () => {
    it('should return paginated and mapped order records', async () => {
      prismaMock.order.count.mockResolvedValue(1);
      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'ord-10',
          orderNumber: 'ORD-20261021-001',
          createdAt: new Date('2026-10-21T10:00:00Z'),
          recipientName: 'Karim Ullah',
          recipientPhone: '01811223344',
          shippingStreet: 'Road 5, House 10',
          shippingCity: 'Dhaka',
          shippingPostalCode: '1212',
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          shipmentStatus: ShipmentStatus.PREPARING,
          grandTotal: '2500.00',
          subtotal: '2400.00',
          discountAmount: '0.00',
          shippingFee: '100.00',
          user: { name: 'Karim Ullah', email: 'karim@example.com' },
          payments: [{ method: PaymentMethod.CASH_ON_DELIVERY }],
          shipments: [{ courierName: 'Pathao', trackingNumber: 'TRK-999' }],
          items: [
            {
              id: 'it-1',
              productTitle: 'Sneakers',
              sku: 'SNK-01',
              variantAttributes: 'Size: 42',
              unitPrice: '2400.00',
              quantity: 1,
              totalPrice: '2400.00',
            },
          ],
        },
      ]);

      const res = await service.getOrdersList({ page: 1, limit: 10 });

      expect(res.total).toBe(1);
      expect(res.items.length).toBe(1);
      expect(res.items[0].orderNumber).toBe('ORD-20261021-001');
      expect(res.items[0].customerName).toBe('Karim Ullah');
      expect(res.items[0].courierName).toBe('Pathao');
      expect(res.items[0].itemsCount).toBe(1);
      expect(res.items[0].grandTotal).toBe(2500);
    });
  });

  describe('exportOrdersCsv', () => {
    it('should generate CSV with order destination and fulfillment headers', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        {
          orderNumber: 'ORD-EXPORT-1',
          createdAt: new Date('2026-10-21T14:00:00Z'),
          recipientName: 'Salma Begum',
          recipientPhone: '01911223344',
          shippingStreet: 'Mirpur 10',
          shippingCity: 'Dhaka',
          shippingPostalCode: '1216',
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          shipmentStatus: ShipmentStatus.DELIVERED,
          grandTotal: '4200.00',
          subtotal: '4000.00',
          discountAmount: '0.00',
          shippingFee: '200.00',
          user: { name: 'Salma Begum', email: 'salma@example.com' },
          payments: [{ method: PaymentMethod.MOBILE_BANKING }],
          shipments: [{ courierName: 'Steadfast', trackingNumber: 'ST-101' }],
          items: [{ quantity: 3 }],
        },
      ]);

      const csv = await service.exportOrdersCsv({});

      expect(csv).toContain('Destination Street,Destination City,Postal Code');
      expect(csv).toContain('"ORD-EXPORT-1"');
      expect(csv).toContain('"Salma Begum"');
      expect(csv).toContain('"Mirpur 10"');
      expect(csv).toContain('"Dhaka"');
      expect(csv).toContain('"Steadfast"');
      expect(csv).toContain('"4200.00"');
    });
  });
});

