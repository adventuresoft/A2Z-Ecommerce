import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsService } from './reports.service.js';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
  StockMovementType,
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
      user: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      orderItem: {
        findMany: vi.fn(),
      },
      inventory: {
        findMany: vi.fn(),
      },
      stockMovement: {
        findMany: vi.fn(),
      },
      productVariant: {
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

  describe('getInventorySummary', () => {
    it('should aggregate inventory units, valuations, and stock health correctly', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          variantId: 'v-1',
          quantity: 20,
          reservedQuantity: 5,
          lowStockThreshold: 5,
          variant: {
            productId: 'p-1',
            regularPrice: '100.00',
            salePrice: '90.00',
          },
        },
        {
          id: 'inv-2',
          variantId: 'v-2',
          quantity: 3,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          variant: {
            productId: 'p-2',
            regularPrice: '50.00',
            salePrice: null,
          },
        },
        {
          id: 'inv-3',
          variantId: 'v-3',
          quantity: 0,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          variant: {
            productId: 'p-2',
            regularPrice: '30.00',
            salePrice: null,
          },
        },
      ]);

      const summary = await service.getInventorySummary({});

      expect(summary.totalSkus).toBe(3);
      expect(summary.totalProducts).toBe(2);
      expect(summary.totalPhysicalUnits).toBe(23);
      expect(summary.totalReservedUnits).toBe(5);
      expect(summary.totalAvailableUnits).toBe(18);
      // Valuation regular: 20*100 + 3*50 + 0*30 = 2150
      expect(summary.totalValuationRegular).toBe(2150);
      // Valuation selling: 20*90 + 3*50 + 0*30 = 1950
      expect(summary.totalValuationSelling).toBe(1950);
      // Health: inv-1 avail=15 > 5 (in stock), inv-2 avail=3 <= 5 (low stock), inv-3 avail=0 <= 0 (out of stock)
      expect(summary.inStockCount).toBe(1);
      expect(summary.lowStockCount).toBe(1);
      expect(summary.outOfStockCount).toBe(1);
      expect(summary.currency).toBe('BDT');
    });
  });

  describe('getInventoryTimeline', () => {
    it('should group stock movements by day interval into inflow and outflow', async () => {
      prismaMock.stockMovement.findMany.mockResolvedValue([
        {
          id: 'sm-1',
          type: StockMovementType.RESTOCK,
          quantityChange: 50,
          previousQuantity: 10,
          newQuantity: 60,
          createdAt: new Date('2026-10-15T10:00:00Z'),
        },
        {
          id: 'sm-2',
          type: StockMovementType.ORDER_FULFILL,
          quantityChange: -10,
          previousQuantity: 60,
          newQuantity: 50,
          createdAt: new Date('2026-10-15T14:00:00Z'),
        },
      ]);

      const res = await service.getInventoryTimeline({ interval: 'day' });

      expect(res.timeline.length).toBe(1);
      expect(res.timeline[0].inflowUnits).toBe(50);
      expect(res.timeline[0].outflowUnits).toBe(10);
      expect(res.timeline[0].netChange).toBe(40);
      expect(res.timeline[0].movementEventsCount).toBe(2);
    });
  });

  describe('getInventoryByStatus', () => {
    it('should categorize inventory into IN_STOCK, LOW_STOCK, and OUT_OF_STOCK metrics', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          quantity: 50,
          reservedQuantity: 5,
          lowStockThreshold: 10,
          variant: { regularPrice: '200.00' },
        },
        {
          quantity: 5,
          reservedQuantity: 0,
          lowStockThreshold: 10,
          variant: { regularPrice: '100.00' },
        },
      ]);

      const breakdown = await service.getInventoryByStatus({});

      expect(breakdown).toHaveLength(3);
      const inStock = breakdown.find((b) => b.status === 'IN_STOCK');
      const lowStock = breakdown.find((b) => b.status === 'LOW_STOCK');
      expect(inStock?.count).toBe(1);
      expect(inStock?.totalValuation).toBe(10000);
      expect(lowStock?.count).toBe(1);
      expect(lowStock?.totalValuation).toBe(500);
    });
  });

  describe('getInventoryByCategory', () => {
    it('should aggregate inventory units and valuations by category', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          quantity: 10,
          reservedQuantity: 2,
          lowStockThreshold: 5,
          variant: {
            regularPrice: '500.00',
            product: {
              category: { id: 'cat-phones', name: 'Smartphones' },
            },
          },
        },
      ]);

      const res = await service.getInventoryByCategory({});

      expect(res).toHaveLength(1);
      expect(res[0].categoryName).toBe('Smartphones');
      expect(res[0].totalUnits).toBe(10);
      expect(res[0].availableUnits).toBe(8);
      expect(res[0].totalValuation).toBe(5000);
    });
  });

  describe('getInventoryByBrand', () => {
    it('should aggregate inventory units and valuations by brand', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          quantity: 15,
          reservedQuantity: 1,
          lowStockThreshold: 5,
          variant: {
            regularPrice: '1000.00',
            product: {
              brand: { id: 'brand-apple', name: 'Apple' },
            },
          },
        },
      ]);

      const res = await service.getInventoryByBrand({});

      expect(res).toHaveLength(1);
      expect(res[0].brandName).toBe('Apple');
      expect(res[0].totalUnits).toBe(15);
      expect(res[0].totalValuation).toBe(15000);
    });
  });

  describe('getInventoryMovementsByType', () => {
    it('should group movements by StockMovementType', async () => {
      prismaMock.stockMovement.findMany.mockResolvedValue([
        { type: StockMovementType.RESTOCK, quantityChange: 200 },
        { type: StockMovementType.DAMAGED, quantityChange: -5 },
      ]);

      const res = await service.getInventoryMovementsByType({});

      const restock = res.find((r) => r.type === StockMovementType.RESTOCK);
      const damaged = res.find((r) => r.type === StockMovementType.DAMAGED);
      expect(restock?.count).toBe(1);
      expect(restock?.quantityIn).toBe(200);
      expect(damaged?.count).toBe(1);
      expect(damaged?.quantityOut).toBe(5);
    });
  });

  describe('getInventoryCriticalAlerts', () => {
    it('should return items below low stock threshold ordered by deficit', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          variantId: 'v-crit-1',
          quantity: 1,
          reservedQuantity: 1, // available = 0
          lowStockThreshold: 5, // deficit = 5
          variant: {
            sku: 'CRIT-1',
            product: { title: 'Critical Item 1', category: { name: 'Cat' } },
          },
        },
        {
          variantId: 'v-safe',
          quantity: 50,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          variant: {
            sku: 'SAFE-1',
            product: { title: 'Safe Item', category: { name: 'Cat' } },
          },
        },
      ]);

      const alerts = await service.getInventoryCriticalAlerts({});

      expect(alerts).toHaveLength(1);
      expect(alerts[0].sku).toBe('CRIT-1');
      expect(alerts[0].status).toBe('OUT_OF_STOCK');
      expect(alerts[0].deficit).toBe(5);
    });
  });

  describe('getInventoryList', () => {
    it('should return sorted and paginated inventory records', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          id: 'inv-item-1',
          variantId: 'v-list-1',
          quantity: 12,
          reservedQuantity: 2,
          lowStockThreshold: 5,
          updatedAt: new Date('2026-10-21T10:00:00Z'),
          variant: {
            sku: 'SKU-001',
            regularPrice: '150.00',
            salePrice: null,
            product: {
              id: 'p-1',
              title: 'Product One',
              slug: 'product-one',
              category: { name: 'Electronics' },
            },
            attributes: [],
          },
        },
      ]);

      const list = await service.getInventoryList({ page: 1, limit: 10 });

      expect(list.total).toBe(1);
      expect(list.items[0].sku).toBe('SKU-001');
      expect(list.items[0].availableQuantity).toBe(10);
      expect(list.items[0].stockStatus).toBe('IN_STOCK');
      expect(list.items[0].totalValuation).toBe(1800);
    });
  });

  describe('exportInventoryCsv', () => {
    it('should generate CSV with SKU, Category, and Valuation', async () => {
      prismaMock.inventory.findMany.mockResolvedValue([
        {
          id: 'inv-item-1',
          variantId: 'v-list-1',
          quantity: 12,
          reservedQuantity: 2,
          lowStockThreshold: 5,
          updatedAt: new Date('2026-10-21T10:00:00Z'),
          variant: {
            sku: 'SKU-CSV',
            regularPrice: '150.00',
            salePrice: null,
            product: {
              id: 'p-1',
              title: 'Product CSV',
              slug: 'product-csv',
              category: { name: 'Gadgets' },
            },
            attributes: [],
          },
        },
      ]);

      const csv = await service.exportInventoryCsv({});

      expect(csv).toContain('SKU,Product Title,Category,Brand,Barcode,Stock Status');
      expect(csv).toContain('"SKU-CSV"');
      expect(csv).toContain('"Product CSV"');
      expect(csv).toContain('"Gadgets"');
      expect(csv).toContain('"1800.00"');
    });
  });

  describe('getCustomerSummary', () => {
    it('should calculate customer totals, retention and LTV accurately', async () => {
      prismaMock.user.count
        .mockResolvedValueOnce(100) // totalCustomers
        .mockResolvedValueOnce(5)   // inactiveCustomersCount
        .mockResolvedValueOnce(20)  // newCustomers
        .mockResolvedValueOnce(30); // zeroOrderCustomers

      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          userId: 'usr-1',
          orderStatus: OrderStatus.DELIVERED,
          grandTotal: '5000.00',
        },
        {
          id: 'ord-2',
          userId: 'usr-1',
          orderStatus: OrderStatus.CONFIRMED,
          grandTotal: '3000.00',
        },
        {
          id: 'ord-3',
          userId: 'usr-2',
          orderStatus: OrderStatus.PROCESSING,
          grandTotal: '2000.00',
        },
        {
          id: 'ord-4',
          userId: 'usr-3',
          orderStatus: OrderStatus.CANCELLED,
          grandTotal: '1000.00',
        },
      ]);

      const summary = await service.getCustomerSummary({});

      expect(summary.totalCustomers).toBe(100);
      expect(summary.inactiveCustomersCount).toBe(5);
      expect(summary.newCustomers).toBe(20);
      expect(summary.zeroOrderCustomers).toBe(30);
      expect(summary.purchasingCustomers).toBe(2); // usr-1 and usr-2
      expect(summary.repeatCustomers).toBe(1); // usr-1 has 2 valid orders
      expect(summary.repeatCustomerRate).toBe(50); // 1 / 2 * 100
      expect(summary.totalOrders).toBe(3); // 3 non-cancelled
      expect(summary.totalRevenue).toBe(10000); // 5000 + 3000 + 2000
      expect(summary.averageCustomerValue).toBe(5000); // 10000 / 2
      expect(summary.averageOrdersPerCustomer).toBe(1.5); // 3 / 2
      expect(summary.currency).toBe('BDT');
    });
  });

  describe('getCustomerTimeline', () => {
    it('should aggregate chronological acquisition and purchasing timeline', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'usr-1', createdAt: new Date('2026-10-15T09:00:00Z') },
        { id: 'usr-2', createdAt: new Date('2026-10-15T14:00:00Z') },
      ]);

      prismaMock.order.findMany.mockResolvedValue([
        {
          id: 'ord-1',
          userId: 'usr-1',
          orderStatus: OrderStatus.DELIVERED,
          grandTotal: '4500.00',
          createdAt: new Date('2026-10-15T10:00:00Z'),
        },
      ]);

      const timeline = await service.getCustomerTimeline({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        interval: 'day',
      });

      expect(timeline.interval).toBe('day');
      expect(timeline.timeline.length).toBeGreaterThan(0);
      const point = timeline.timeline.find((p) => p.date === '2026-10-15');
      expect(point).toBeDefined();
      expect(point?.newRegistrations).toBe(2);
      expect(point?.purchasingCustomers).toBe(1);
      expect(point?.ordersPlaced).toBe(1);
      expect(point?.revenue).toBe(4500);
    });
  });

  describe('getCustomerSegments', () => {
    it('should categorize customers into VIP, Regular, One-Time and Zero-Order', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'usr-vip',
          orders: [{ grandTotal: '12000.00' }],
        },
        {
          id: 'usr-reg',
          orders: [{ grandTotal: '2000.00' }, { grandTotal: '1500.00' }],
        },
        {
          id: 'usr-once',
          orders: [{ grandTotal: '800.00' }],
        },
        {
          id: 'usr-zero',
          orders: [],
        },
      ]);

      const segments = await service.getCustomerSegments({});

      expect(segments).toHaveLength(4);
      const vip = segments.find((s) => s.segment === 'VIP');
      const reg = segments.find((s) => s.segment === 'REGULAR');
      const once = segments.find((s) => s.segment === 'ONE_TIME');
      const zero = segments.find((s) => s.segment === 'ZERO_ORDER');

      expect(vip?.customerCount).toBe(1);
      expect(vip?.totalRevenue).toBe(12000);
      expect(reg?.customerCount).toBe(1);
      expect(reg?.totalRevenue).toBe(3500);
      expect(once?.customerCount).toBe(1);
      expect(once?.totalRevenue).toBe(800);
      expect(zero?.customerCount).toBe(1);
      expect(zero?.totalRevenue).toBe(0);
    });
  });

  describe('getCustomerByCity', () => {
    it('should aggregate customer distribution by shipping destination city', async () => {
      prismaMock.order.findMany.mockResolvedValue([
        { userId: 'u1', shippingCity: 'Dhaka', grandTotal: '3000.00' },
        { userId: 'u2', shippingCity: 'Dhaka', grandTotal: '2000.00' },
        { userId: 'u3', shippingCity: 'Chittagong', grandTotal: '1500.00' },
      ]);

      const cities = await service.getCustomerByCity({}, 5);

      expect(cities).toHaveLength(2);
      expect(cities[0].city).toBe('Dhaka');
      expect(cities[0].customerCount).toBe(2);
      expect(cities[0].orderCount).toBe(2);
      expect(cities[0].totalRevenue).toBe(5000);

      expect(cities[1].city).toBe('Chittagong');
      expect(cities[1].customerCount).toBe(1);
      expect(cities[1].totalRevenue).toBe(1500);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top spending customers ordered by total spent', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          name: 'Top Spender',
          email: 'top@example.com',
          phone: '+8801700000001',
          isActive: true,
          createdAt: new Date('2026-01-01'),
          orders: [
            {
              id: 'o1',
              grandTotal: '15000.00',
              shippingCity: 'Dhaka',
              createdAt: new Date('2026-10-10'),
            },
          ],
        },
        {
          id: 'u2',
          name: 'Medium Spender',
          email: 'med@example.com',
          phone: null,
          isActive: true,
          createdAt: new Date('2026-02-01'),
          orders: [
            {
              id: 'o2',
              grandTotal: '5000.00',
              shippingCity: 'Sylhet',
              createdAt: new Date('2026-10-12'),
            },
          ],
        },
      ]);

      const top = await service.getTopCustomers({}, 10);

      expect(top).toHaveLength(2);
      expect(top[0].name).toBe('Top Spender');
      expect(top[0].totalSpent).toBe(15000);
      expect(top[0].primaryCity).toBe('Dhaka');
      expect(top[1].name).toBe('Medium Spender');
      expect(top[1].totalSpent).toBe(5000);
    });
  });

  describe('getCustomerList & exportCustomerCsv', () => {
    it('should paginate and export customer records with order metrics', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'u-list-1',
          name: 'Customer List',
          email: 'list@example.com',
          phone: '+8801700000009',
          isActive: true,
          createdAt: new Date('2026-03-01T12:00:00Z'),
          orders: [
            {
              id: 'o-list-1',
              orderStatus: OrderStatus.DELIVERED,
              grandTotal: '7500.00',
              shippingCity: 'Dhaka',
              createdAt: new Date('2026-10-15T10:00:00Z'),
            },
            {
              id: 'o-list-2',
              orderStatus: OrderStatus.CANCELLED,
              grandTotal: '2000.00',
              shippingCity: 'Dhaka',
              createdAt: new Date('2026-10-14T10:00:00Z'),
            },
          ],
          reviews: [{ id: 'rev-1' }],
        },
      ]);

      const list = await service.getCustomerList({ page: 1, limit: 10 });

      expect(list.total).toBe(1);
      expect(list.items[0].name).toBe('Customer List');
      expect(list.items[0].ordersCount).toBe(2);
      expect(list.items[0].deliveredOrdersCount).toBe(1);
      expect(list.items[0].cancelledOrdersCount).toBe(1);
      expect(list.items[0].totalSpent).toBe(7500);
      expect(list.items[0].reviewsCount).toBe(1);
      expect(list.items[0].primaryCity).toBe('Dhaka');

      const csv = await service.exportCustomerCsv({});
      expect(csv).toContain('Customer ID,Name,Email,Phone,Status');
      expect(csv).toContain('"Customer List"');
      expect(csv).toContain('"list@example.com"');
      expect(csv).toContain('"7500.00"');
    });
  });
});


