import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShipmentsService } from './shipments.service.js';
import { OrderStatus, ShipmentStatus } from '@prisma/client';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let prismaMock: any;
  let inventoryServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      shippingZone: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      shippingMethod: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      shipment: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      shipmentStatusHistory: {
        create: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    inventoryServiceMock = {
      fulfillReservedStock: vi.fn().mockResolvedValue(undefined),
      reserveStock: vi.fn().mockResolvedValue(undefined),
      releaseReservedStock: vi.fn().mockResolvedValue(undefined),
      restoreStock: vi.fn().mockResolvedValue(undefined),
    };

    service = new ShipmentsService(prismaMock, inventoryServiceMock);
  });

  describe('Shipping Zones', () => {
    it('should create a new shipping zone', async () => {
      prismaMock.shippingZone.findFirst.mockResolvedValue(null);
      prismaMock.shippingZone.create.mockResolvedValue({
        id: 'zone-1',
        name: 'Inside Dhaka',
        description: 'Metropolitan area',
        isActive: true,
        sortOrder: 0,
        _count: { methods: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createZone({
        name: 'Inside Dhaka',
        description: 'Metropolitan area',
      });

      expect(result.id).toBe('zone-1');
      expect(result.name).toBe('Inside Dhaka');
      expect(prismaMock.shippingZone.create).toHaveBeenCalled();
    });

    it('should reject creating duplicate shipping zone name', async () => {
      prismaMock.shippingZone.findFirst.mockResolvedValue({ id: 'zone-1', name: 'Inside Dhaka' });

      await expect(
        service.createZone({ name: 'Inside Dhaka' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Shipping Methods', () => {
    it('should create a new shipping rate method for valid zone', async () => {
      prismaMock.shippingZone.findUnique.mockResolvedValue({ id: 'zone-1', name: 'Inside Dhaka' });
      prismaMock.shippingMethod.create.mockResolvedValue({
        id: 'method-1',
        zoneId: 'zone-1',
        name: 'Standard Delivery',
        cost: 60,
        estimatedDays: 2,
        isActive: true,
        sortOrder: 0,
        zone: { name: 'Inside Dhaka' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createMethod({
        zoneId: 'zone-1',
        name: 'Standard Delivery',
        cost: 60,
        estimatedDays: 2,
      });

      expect(result.id).toBe('method-1');
      expect(result.cost).toBe(60);
      expect(result.zoneName).toBe('Inside Dhaka');
    });

    it('should throw NotFoundException if zoneId does not exist', async () => {
      prismaMock.shippingZone.findUnique.mockResolvedValue(null);

      await expect(
        service.createMethod({
          zoneId: 'non-existent',
          name: 'Express Delivery',
          cost: 120,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Shipments Dispatch & Lifecycle', () => {
    it('should create a shipment for a CONFIRMED order and set status to PREPARING', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'AZ-2026-X1Y2Z3',
        orderStatus: OrderStatus.CONFIRMED,
        shipmentStatus: ShipmentStatus.UNFULFILLED,
        items: [{ variantId: 'var-1', quantity: 2 }],
      };

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          shipment: {
            create: vi.fn().mockResolvedValue({
              id: 'shipment-1',
              orderId: 'order-1',
              courierName: 'Steadfast Courier',
              trackingNumber: 'ST-2026-001',
              status: ShipmentStatus.PREPARING,
              order: mockOrder,
              statusHistory: [
                {
                  id: 'hist-1',
                  fromStatus: null,
                  toStatus: ShipmentStatus.PREPARING,
                  notes: 'Shipment created',
                  createdAt: new Date(),
                },
              ],
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          order: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.createShipment(
        {
          orderId: 'order-1',
          courierName: 'Steadfast Courier',
          trackingNumber: 'ST-2026-001',
        },
        'admin-user-1',
      );

      expect(result.id).toBe('shipment-1');
      expect(result.status).toBe(ShipmentStatus.PREPARING);
      expect(result.courierName).toBe('Steadfast Courier');
    });

    it('should reject creating shipment for PENDING order', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order-pending',
        orderStatus: OrderStatus.PENDING,
        items: [],
      });

      await expect(
        service.createShipment({
          orderId: 'order-pending',
          courierName: 'Steadfast Courier',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creating shipment for CANCELLED order', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order-cancelled',
        orderStatus: OrderStatus.CANCELLED,
        items: [],
      });

      await expect(
        service.createShipment({
          orderId: 'order-cancelled',
          courierName: 'Steadfast Courier',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should transition status to DISPATCHED and trigger order status to SHIPPED and inventory fulfillment', async () => {
      const mockShipment = {
        id: 'shipment-1',
        status: ShipmentStatus.PREPARING,
        courierName: 'Steadfast',
        trackingNumber: 'ST-001',
        order: {
          id: 'order-1',
          orderStatus: OrderStatus.CONFIRMED,
          shipmentStatus: ShipmentStatus.PREPARING,
          items: [{ variantId: 'var-1', quantity: 3 }],
        },
      };

      prismaMock.shipment.findUnique.mockResolvedValue(mockShipment);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          shipment: {
            update: vi.fn().mockResolvedValue({}),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              ...mockShipment,
              status: ShipmentStatus.DISPATCHED,
              shippedAt: new Date(),
              statusHistory: [],
              order: { ...mockShipment.order, orderStatus: OrderStatus.SHIPPED },
            }),
          },
          shipmentStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
          order: {
            update: vi.fn().mockResolvedValue({}),
          },
          orderStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.updateShipmentStatus(
        'shipment-1',
        { status: ShipmentStatus.DISPATCHED, notes: 'Dispatched from hub' },
        'admin-user-1',
      );

      expect(result.status).toBe(ShipmentStatus.DISPATCHED);
      expect(inventoryServiceMock.fulfillReservedStock).toHaveBeenCalledWith(
        'var-1',
        3,
        'order-1',
        expect.anything(),
      );
    });

    it('should reject invalid shipment transition from DELIVERED to PREPARING', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({
        id: 'shipment-1',
        status: ShipmentStatus.DELIVERED,
      });

      await expect(
        service.updateShipmentStatus('shipment-1', {
          status: ShipmentStatus.PREPARING,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Customer and Public Tracking', () => {
    it('should return public tracking info by tracking number', async () => {
      prismaMock.shipment.findFirst.mockResolvedValue({
        id: 'shipment-1',
        trackingNumber: 'ST-2026-999',
        courierName: 'Steadfast Courier',
        status: ShipmentStatus.IN_TRANSIT,
        trackingUrl: 'https://steadfast.com.bd/t/ST-2026-999',
        shippedAt: new Date(),
        deliveredAt: null,
        statusHistory: [
          {
            id: 'hist-1',
            fromStatus: ShipmentStatus.PREPARING,
            toStatus: ShipmentStatus.DISPATCHED,
            notes: 'Picked up',
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.getPublicTracking('ST-2026-999');

      expect(result.trackingNumber).toBe('ST-2026-999');
      expect(result.status).toBe(ShipmentStatus.IN_TRANSIT);
      expect(result.courierName).toBe('Steadfast Courier');
      expect(result.statusHistory.length).toBe(1);
    });

    it('should throw NotFoundException if public tracking number is unknown', async () => {
      prismaMock.shipment.findFirst.mockResolvedValue(null);

      await expect(service.getPublicTracking('UNKNOWN-TRACKING')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
