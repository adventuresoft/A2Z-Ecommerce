import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrderStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaMock: any;
  let inventoryServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      order: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      productVariant: {
        findMany: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    inventoryServiceMock = {
      reserveStock: vi.fn().mockResolvedValue(undefined),
      releaseReservedStock: vi.fn().mockResolvedValue(undefined),
      fulfillReservedStock: vi.fn().mockResolvedValue(undefined),
      restoreStock: vi.fn().mockResolvedValue(undefined),
    };

    const auditLogsServiceMock: any = {
      log: vi.fn().mockResolvedValue(undefined),
      getAuditLogs: vi.fn().mockResolvedValue({ data: [], meta: {} }),
      getFilterOptions: vi.fn().mockResolvedValue({ actions: [], entityTypes: [] }),
      getAuditLogById: vi.fn().mockResolvedValue(null),
    };

    const taxesServiceMock: any = {
      resolveEffectiveTaxClass: vi.fn().mockResolvedValue({
        taxRate: 5,
        taxClassName: 'Standard Electronics VAT',
        taxClassId: 'tax-1',
      }),
      calculateLineItemTax: vi.fn().mockImplementation((unitPrice: number, qty: number, taxRate: number, name?: string) => {
        const gross = Number((unitPrice * qty).toFixed(2));
        const netUnit = Number((unitPrice / (1 + taxRate / 100)).toFixed(2));
        const unitTax = Number((unitPrice - netUnit).toFixed(2));
        const totalTax = Number((unitTax * qty).toFixed(2));
        const totalNet = Number((gross - totalTax).toFixed(2));
        return {
          unitPrice,
          quantity: qty,
          netUnitPrice: netUnit,
          unitTax,
          totalGross: gross,
          totalTax,
          totalNet,
          taxRate,
          taxClassName: name || 'Standard Electronics VAT',
        };
      }),
    };

    service = new OrdersService(
      prismaMock,
      inventoryServiceMock,
      auditLogsServiceMock,
      taxesServiceMock,
    );
  });

  describe('createOrder', () => {
    it('should successfully place an order with server-calculated totals and stock reservations', async () => {
      const mockVariant = {
        id: 'var-1',
        sku: 'TSHIRT-BLK-XL',
        regularPrice: 500,
        salePrice: 450,
        isActive: true,
        product: {
          title: 'Premium T-Shirt',
        },
        attributes: [
          {
            attributeValue: {
              value: 'Black',
              attribute: { name: 'Color' },
            },
          },
        ],
      };

      const mockCreatedOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-X1Y2Z3',
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
        shippingStreet: 'Road 5, House 12',
        shippingCity: 'Dhaka',
        shippingState: null,
        shippingPostalCode: '1213',
        customerNotes: null,
        items: [
          {
            id: 'item-1',
            variantId: 'var-1',
            productTitle: 'Premium T-Shirt',
            sku: 'TSHIRT-BLK-XL',
            variantAttributes: 'Color: Black',
            unitPrice: 450,
            quantity: 2,
            totalPrice: 900,
            variant: {
              imageUrl: 'https://images.example.com/tshirt.png',
            },
          },
        ],
        statusHistory: [
          {
            id: 'hist-1',
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            notes: 'Order placed by customer',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          productVariant: {
            findMany: vi.fn().mockResolvedValue([mockVariant]),
          },
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'order-1' }),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockCreatedOrder),
          },
        };
        return cb(tx);
      });

      const result = await service.createOrder('user-1', {
        recipientName: 'Karim Ahmed',
        recipientPhone: '+8801712345678',
        shippingStreet: 'Road 5, House 12',
        shippingCity: 'Dhaka',
        shippingPostalCode: '1213',
        items: [
          {
            variantId: 'var-1',
            quantity: 2,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('order-1');
      expect(result.subtotal).toBe(900);
      expect(result.grandTotal).toBe(960);
      expect(result.orderStatus).toBe(OrderStatus.PENDING);
      expect(inventoryServiceMock.reserveStock).toHaveBeenCalledWith(
        'var-1',
        2,
        'order-1',
        expect.anything(),
      );
    });

    it('should calculate and persist tax snapshots during order creation', async () => {
      const mockVariant = {
        id: 'var-tax',
        productId: 'prod-tax',
        sku: 'ELEC-KEYBOARD',
        regularPrice: 1050,
        salePrice: null,
        isActive: true,
        product: {
          id: 'prod-tax',
          title: 'Mechanical Keyboard',
          categoryId: 'cat-elec',
        },
        attributes: [],
      };

      let capturedOrderData: any = null;

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          productVariant: {
            findMany: vi.fn().mockResolvedValue([mockVariant]),
          },
          order: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(({ data }: any) => {
              capturedOrderData = data;
              return { id: 'order-tax-1' };
            }),
            findUniqueOrThrow: vi.fn().mockImplementation(() => ({
              id: 'order-tax-1',
              orderNumber: 'AZ-2026-TAX001',
              userId: 'user-1',
              orderStatus: OrderStatus.PENDING,
              paymentStatus: PaymentStatus.PENDING,
              shipmentStatus: ShipmentStatus.UNFULFILLED,
              subtotal: capturedOrderData.subtotal,
              discountAmount: capturedOrderData.discountAmount,
              shippingFee: capturedOrderData.shippingFee,
              totalTaxAmount: capturedOrderData.totalTaxAmount,
              grandTotal: capturedOrderData.grandTotal,
              recipientName: capturedOrderData.recipientName,
              recipientPhone: capturedOrderData.recipientPhone,
              shippingStreet: capturedOrderData.shippingStreet,
              shippingCity: capturedOrderData.shippingCity,
              shippingState: null,
              shippingPostalCode: capturedOrderData.shippingPostalCode,
              customerNotes: null,
              items: capturedOrderData.items.create.map((item: any, idx: number) => ({
                id: `item-${idx + 1}`,
                ...item,
                variant: { imageUrl: null },
              })),
              statusHistory: [],
              shipments: [],
              payments: [],
              refunds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          },
        };
        return cb(tx);
      });

      const res = await service.createOrder('user-1', {
        recipientName: 'Tax Customer',
        recipientPhone: '+8801700000000',
        shippingStreet: '123 Tech St',
        shippingCity: 'Dhaka',
        shippingPostalCode: '1205',
        items: [{ variantId: 'var-tax', quantity: 1 }],
      });

      expect(capturedOrderData).toBeDefined();
      // 5% tax on 1050 tax-inclusive:
      // netUnitPrice = 1050 / 1.05 = 1000.00, tax = 50.00
      expect(capturedOrderData.totalTaxAmount).toBe(50);
      expect(capturedOrderData.items.create[0]).toMatchObject({
        taxRate: 5,
        taxAmount: 50,
        taxClassName: 'Standard Electronics VAT',
      });
      expect(res.totalTaxAmount).toBe(50);
      expect(res.items[0].taxRate).toBe(5);
      expect(res.items[0].taxAmount).toBe(50);
      expect(res.items[0].taxClassName).toBe('Standard Electronics VAT');
    });

    it('should throw BadRequestException if order has no items', async () => {
      await expect(
        service.createOrder('user-1', {
          recipientName: 'Karim Ahmed',
          recipientPhone: '+8801712345678',
          shippingStreet: 'Road 5',
          shippingCity: 'Dhaka',
          shippingPostalCode: '1213',
          items: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if variant does not exist', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          productVariant: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('user-1', {
          recipientName: 'Karim Ahmed',
          recipientPhone: '+8801712345678',
          shippingStreet: 'Road 5',
          shippingCity: 'Dhaka',
          shippingPostalCode: '1213',
          items: [{ variantId: 'missing-var', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if variant is inactive', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          productVariant: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'inactive-var',
                sku: 'INACTIVE-01',
                isActive: false,
                product: { title: 'Inactive' },
              },
            ]),
          },
        };
        return cb(tx);
      });

      await expect(
        service.createOrder('user-1', {
          recipientName: 'Karim Ahmed',
          recipientPhone: '+8801712345678',
          shippingStreet: 'Road 5',
          shippingCity: 'Dhaka',
          shippingPostalCode: '1213',
          items: [{ variantId: 'inactive-var', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelCustomerOrder', () => {
    it('should cancel PENDING order and release reserved stock', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        orderStatus: OrderStatus.PENDING,
        items: [{ variantId: 'var-1', quantity: 2 }],
      };

      prismaMock.order.findFirst.mockResolvedValue(mockOrder);

      const mockCancelledOrder = {
        ...mockOrder,
        orderNumber: 'AZ-2026-X1Y2Z3',
        subtotal: 900,
        discountAmount: 0,
        shippingFee: 60,
        grandTotal: 960,
        paymentStatus: PaymentStatus.PENDING,
        shipmentStatus: ShipmentStatus.UNFULFILLED,
        recipientName: 'Karim',
        recipientPhone: '123',
        shippingStreet: 'Street',
        shippingCity: 'City',
        shippingPostalCode: '1234',
        orderStatus: OrderStatus.CANCELLED,
        items: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            update: vi.fn(),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockCancelledOrder),
          },
        };
        return cb(tx);
      });

      const result = await service.cancelCustomerOrder('user-1', 'order-1', {
        reason: 'Changed mind',
      });

      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(inventoryServiceMock.releaseReservedStock).toHaveBeenCalledWith(
        'var-1',
        2,
        'order-1',
        expect.anything(),
      );
    });

    it('should reject cancellation if order status is not PENDING', async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        orderStatus: OrderStatus.PROCESSING,
        items: [],
      });

      await expect(
        service.cancelCustomerOrder('user-1', 'order-1', { reason: 'Too late' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrderStatus', () => {
    it('should fulfill reserved inventory stock when admin transitions order to SHIPPED', async () => {
      const mockOrder = {
        id: 'order-1',
        orderStatus: OrderStatus.PROCESSING,
        shipmentStatus: ShipmentStatus.PREPARING,
        items: [{ variantId: 'var-1', quantity: 3 }],
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      const mockShippedOrder = {
        ...mockOrder,
        orderNumber: 'AZ-2026-123456',
        userId: 'user-1',
        subtotal: 1000,
        discountAmount: 0,
        shippingFee: 60,
        grandTotal: 1060,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.SHIPPED,
        shipmentStatus: ShipmentStatus.DISPATCHED,
        recipientName: 'Karim',
        recipientPhone: '123',
        shippingStreet: 'Street',
        shippingCity: 'City',
        shippingPostalCode: '1234',
        items: [],
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            update: vi.fn(),
            findUniqueOrThrow: vi.fn().mockResolvedValue(mockShippedOrder),
          },
          orderStatusHistory: {
            create: vi.fn(),
          },
        };
        return cb(tx);
      });

      const result = await service.updateOrderStatus(
        'order-1',
        {
          orderStatus: OrderStatus.SHIPPED,
          notes: 'Handed to courier driver',
        },
        'admin-user-id',
      );

      expect(result.orderStatus).toBe(OrderStatus.SHIPPED);
      expect(inventoryServiceMock.fulfillReservedStock).toHaveBeenCalledWith(
        'var-1',
        3,
        'order-1',
        expect.anything(),
      );
    });

    it('should reject invalid status transition, e.g. DELIVERED to PENDING', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order-1',
        orderStatus: OrderStatus.DELIVERED,
        items: [],
      });

      await expect(
        service.updateOrderStatus('order-1', {
          orderStatus: OrderStatus.PENDING,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
