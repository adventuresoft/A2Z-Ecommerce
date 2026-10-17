import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersController } from './orders.controller.js';
import { OrdersAdminController } from './orders.admin.controller.js';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

describe('Orders Controllers', () => {
  let ordersServiceMock: any;
  let customerController: OrdersController;
  let adminController: OrdersAdminController;

  const mockUserPayload = {
    sub: 'user-1',
    email: 'customer@az-ecommerce.local',
    role: 'CUSTOMER' as const,
  };

  const mockOrderResponse = {
    id: 'order-1',
    orderNumber: 'AZ-2026-TEST01',
    userId: 'user-1',
    orderStatus: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    shipmentStatus: ShipmentStatus.UNFULFILLED,
    subtotal: 900,
    discountAmount: 0,
    shippingFee: 60,
    grandTotal: 960,
    recipientName: 'Karim Ahmed',
    recipientPhone: '+8801712345678',
    shippingStreet: 'Road 5',
    shippingCity: 'Dhaka',
    shippingPostalCode: '1213',
    items: [],
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    ordersServiceMock = {
      createOrder: vi.fn().mockResolvedValue(mockOrderResponse),
      getCustomerOrders: vi.fn().mockResolvedValue({
        data: [mockOrderResponse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      getCustomerOrderById: vi.fn().mockResolvedValue(mockOrderResponse),
      cancelCustomerOrder: vi.fn().mockResolvedValue({
        ...mockOrderResponse,
        orderStatus: OrderStatus.CANCELLED,
      }),
      getAdminOrders: vi.fn().mockResolvedValue({
        data: [mockOrderResponse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      getAdminOrderById: vi.fn().mockResolvedValue(mockOrderResponse),
      updateOrderStatus: vi.fn().mockResolvedValue({
        ...mockOrderResponse,
        orderStatus: OrderStatus.CONFIRMED,
      }),
    };

    customerController = new OrdersController(ordersServiceMock);
    adminController = new OrdersAdminController(ordersServiceMock);
  });

  describe('OrdersController (Customer)', () => {
    it('should place an order and return the created order', async () => {
      const dto = {
        recipientName: 'Karim Ahmed',
        recipientPhone: '+8801712345678',
        shippingStreet: 'Road 5',
        shippingCity: 'Dhaka',
        shippingPostalCode: '1213',
        items: [{ variantId: 'var-1', quantity: 2 }],
      };

      const result = await customerController.create(mockUserPayload, dto);
      expect(result).toEqual(mockOrderResponse);
      expect(ordersServiceMock.createOrder).toHaveBeenCalledWith('user-1', dto);
    });

    it('should retrieve customer order history', async () => {
      const result = await customerController.getMyOrders(mockUserPayload, {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(ordersServiceMock.getCustomerOrders).toHaveBeenCalledWith(
        'user-1',
        { page: 1, limit: 10 },
      );
    });

    it('should retrieve customer order by id', async () => {
      const result = await customerController.getOrderById(
        mockUserPayload,
        'order-1',
      );
      expect(result.id).toBe('order-1');
      expect(ordersServiceMock.getCustomerOrderById).toHaveBeenCalledWith(
        'user-1',
        'order-1',
      );
    });

    it('should cancel customer order', async () => {
      const result = await customerController.cancelOrder(
        mockUserPayload,
        'order-1',
        { reason: 'Mistake' },
      );
      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(ordersServiceMock.cancelCustomerOrder).toHaveBeenCalledWith(
        'user-1',
        'order-1',
        { reason: 'Mistake' },
      );
    });
  });

  describe('OrdersAdminController (Admin)', () => {
    it('should list admin orders', async () => {
      const result = await adminController.getOrders({
        page: 1,
        limit: 10,
        orderStatus: OrderStatus.PENDING,
      });
      expect(result.data).toHaveLength(1);
      expect(ordersServiceMock.getAdminOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        orderStatus: OrderStatus.PENDING,
      });
    });

    it('should retrieve admin order details by id', async () => {
      const result = await adminController.getOrderById('order-1');
      expect(result.id).toBe('order-1');
      expect(ordersServiceMock.getAdminOrderById).toHaveBeenCalledWith(
        'order-1',
      );
    });

    it('should update order status', async () => {
      const result = await adminController.updateStatus(
        'order-1',
        { orderStatus: OrderStatus.CONFIRMED, notes: 'Verified' },
        { sub: 'admin-1', email: 'admin@a2z.com', role: 'ADMIN' },
      );
      expect(result.orderStatus).toBe(OrderStatus.CONFIRMED);
      expect(ordersServiceMock.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        { orderStatus: OrderStatus.CONFIRMED, notes: 'Verified' },
        'admin-1',
      );
    });
  });
});
