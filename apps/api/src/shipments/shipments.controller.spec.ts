import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsAdminController } from './shipments.admin.controller.js';
import { ShippingZonesAdminController } from './shipping-zones.admin.controller.js';
import { ShippingMethodsAdminController } from './shipping-methods.admin.controller.js';
import { ShipmentStatus } from '@prisma/client';

describe('Shipments Controllers', () => {
  let shipmentsServiceMock: any;
  let publicController: ShipmentsController;
  let shipmentsAdminController: ShipmentsAdminController;
  let zonesAdminController: ShippingZonesAdminController;
  let methodsAdminController: ShippingMethodsAdminController;

  const mockUserPayload = {
    sub: 'admin-1',
    email: 'admin@az-ecommerce.local',
    role: 'ADMIN' as const,
  };

  const mockShipmentResponse = {
    id: 'shipment-1',
    orderId: 'order-1',
    courierName: 'Steadfast',
    trackingNumber: 'ST-001',
    status: ShipmentStatus.PREPARING,
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    shipmentsServiceMock = {
      createZone: vi.fn().mockResolvedValue({ id: 'zone-1', name: 'Inside Dhaka' }),
      getAllZones: vi.fn().mockResolvedValue([{ id: 'zone-1', name: 'Inside Dhaka' }]),
      getZoneById: vi.fn().mockResolvedValue({ id: 'zone-1', name: 'Inside Dhaka', methods: [] }),
      updateZone: vi.fn().mockResolvedValue({ id: 'zone-1', name: 'Inside Dhaka City' }),
      deleteZone: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),

      createMethod: vi.fn().mockResolvedValue({ id: 'method-1', name: 'Standard Delivery', cost: 60 }),
      getAllMethods: vi.fn().mockResolvedValue([{ id: 'method-1', name: 'Standard Delivery', cost: 60 }]),
      getMethodById: vi.fn().mockResolvedValue({ id: 'method-1', name: 'Standard Delivery', cost: 60 }),
      updateMethod: vi.fn().mockResolvedValue({ id: 'method-1', name: 'Standard Delivery', cost: 70 }),
      deleteMethod: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),

      createShipment: vi.fn().mockResolvedValue(mockShipmentResponse),
      getAdminShipments: vi.fn().mockResolvedValue({
        data: [mockShipmentResponse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      getShipmentById: vi.fn().mockResolvedValue(mockShipmentResponse),
      updateShipmentStatus: vi.fn().mockResolvedValue({
        ...mockShipmentResponse,
        status: ShipmentStatus.DISPATCHED,
      }),
      updateShipmentDetails: vi.fn().mockResolvedValue(mockShipmentResponse),

      getCustomerShipmentsForOrder: vi.fn().mockResolvedValue([mockShipmentResponse]),
      getPublicTracking: vi.fn().mockResolvedValue({
        trackingNumber: 'ST-001',
        courierName: 'Steadfast',
        status: ShipmentStatus.PREPARING,
        statusHistory: [],
      }),
    };

    publicController = new ShipmentsController(shipmentsServiceMock);
    shipmentsAdminController = new ShipmentsAdminController(shipmentsServiceMock);
    zonesAdminController = new ShippingZonesAdminController(shipmentsServiceMock);
    methodsAdminController = new ShippingMethodsAdminController(shipmentsServiceMock);
  });

  describe('Public / Customer ShipmentsController', () => {
    it('should retrieve active shipping zones', async () => {
      const result = await publicController.getActiveZones();
      expect(result).toHaveLength(1);
      expect(shipmentsServiceMock.getAllZones).toHaveBeenCalledWith(false);
    });

    it('should retrieve active shipping methods', async () => {
      const result = await publicController.getActiveMethods('zone-1');
      expect(result).toHaveLength(1);
      expect(shipmentsServiceMock.getAllMethods).toHaveBeenCalledWith({ zoneId: 'zone-1', includeInactive: false });
    });

    it('should lookup public tracking info', async () => {
      const result = await publicController.trackShipment('ST-001');
      expect(result.trackingNumber).toBe('ST-001');
      expect(shipmentsServiceMock.getPublicTracking).toHaveBeenCalledWith('ST-001');
    });

    it('should retrieve customer order shipments', async () => {
      const result = await publicController.getOrderShipments('order-1', mockUserPayload);
      expect(result).toHaveLength(1);
      expect(shipmentsServiceMock.getCustomerShipmentsForOrder).toHaveBeenCalledWith('admin-1', 'order-1');
    });
  });

  describe('Admin ShipmentsAdminController', () => {
    it('should create a shipment', async () => {
      const dto = { orderId: 'order-1', courierName: 'Steadfast', trackingNumber: 'ST-001' };
      const result = await shipmentsAdminController.createShipment(dto, mockUserPayload);
      expect(result.id).toBe('shipment-1');
      expect(shipmentsServiceMock.createShipment).toHaveBeenCalledWith(dto, 'admin-1');
    });

    it('should update shipment status', async () => {
      const dto = { status: ShipmentStatus.DISPATCHED, notes: 'Dispatched' };
      const result = await shipmentsAdminController.updateStatus('shipment-1', dto, mockUserPayload);
      expect(result.status).toBe(ShipmentStatus.DISPATCHED);
      expect(shipmentsServiceMock.updateShipmentStatus).toHaveBeenCalledWith('shipment-1', dto, 'admin-1');
    });
  });

  describe('Admin ShippingZonesAdminController & ShippingMethodsAdminController', () => {
    it('should create and list shipping zones', async () => {
      const zoneDto = { name: 'Inside Dhaka' };
      const result = await zonesAdminController.createZone(zoneDto);
      expect(result.name).toBe('Inside Dhaka');
      const zones = await zonesAdminController.getZones();
      expect(zones).toHaveLength(1);
    });

    it('should create and list shipping methods', async () => {
      const methodDto = { zoneId: 'zone-1', name: 'Standard Delivery', cost: 60 };
      const result = await methodsAdminController.createMethod(methodDto);
      expect(result.cost).toBe(60);
      const methods = await methodsAdminController.getMethods('zone-1');
      expect(methods).toHaveLength(1);
    });
  });
});
