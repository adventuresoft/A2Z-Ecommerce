import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  ShipmentStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import type {
  CreateShipmentDto,
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  PaginatedShipmentsResponseDto,
  PublicTrackingResponseDto,
  QueryShipmentsDto,
  ShipmentResponseDto,
  ShippingMethodResponseDto,
  ShippingZoneResponseDto,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateShippingMethodDto,
  UpdateShippingZoneDto,
} from './dto/index.js';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helper Mappers
  // ---------------------------------------------------------------------------

  private mapZone(zone: any): ShippingZoneResponseDto {
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description || null,
      isActive: zone.isActive,
      sortOrder: zone.sortOrder,
      methodsCount:
        zone._count?.methods !== undefined
          ? zone._count.methods
          : zone.methods
            ? zone.methods.length
            : undefined,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    };
  }

  private mapMethod(method: any): ShippingMethodResponseDto {
    return {
      id: method.id,
      zoneId: method.zoneId,
      zoneName: method.zone?.name || undefined,
      name: method.name,
      cost: Number(method.cost),
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
      sortOrder: method.sortOrder,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
    };
  }

  private mapShipment(shipment: any): ShipmentResponseDto {
    const statusHistory = (shipment.statusHistory || []).map((h: any) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes || null,
      changedByUserName: h.changedByUser?.name || null,
      createdAt: h.createdAt,
    }));

    return {
      id: shipment.id,
      orderId: shipment.orderId,
      orderNumber: shipment.order?.orderNumber || undefined,
      shippingMethodId: shipment.shippingMethodId || null,
      shippingMethodName: shipment.shippingMethod?.name || null,
      courierName: shipment.courierName,
      trackingNumber: shipment.trackingNumber || null,
      trackingUrl: shipment.trackingUrl || null,
      status: shipment.status,
      notes: shipment.notes || null,
      recipientName: shipment.order?.recipientName || undefined,
      recipientPhone: shipment.order?.recipientPhone || undefined,
      shippingStreet: shipment.order?.shippingStreet || undefined,
      shippingCity: shipment.order?.shippingCity || undefined,
      shippedAt: shipment.shippedAt || null,
      deliveredAt: shipment.deliveredAt || null,
      statusHistory,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Transit State Machine
  // ---------------------------------------------------------------------------

  private validateStatusTransition(
    currentStatus: ShipmentStatus,
    newStatus: ShipmentStatus,
  ): void {
    if (currentStatus === newStatus) {
      return;
    }

    const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.UNFULFILLED]: [
        ShipmentStatus.PREPARING,
        ShipmentStatus.DISPATCHED,
      ],
      [ShipmentStatus.PREPARING]: [
        ShipmentStatus.DISPATCHED,
        ShipmentStatus.FAILED_DELIVERY,
      ],
      [ShipmentStatus.DISPATCHED]: [
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.FAILED_DELIVERY,
      ],
      [ShipmentStatus.IN_TRANSIT]: [
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.FAILED_DELIVERY,
      ],
      [ShipmentStatus.OUT_FOR_DELIVERY]: [
        ShipmentStatus.DELIVERED,
        ShipmentStatus.FAILED_DELIVERY,
      ],
      [ShipmentStatus.FAILED_DELIVERY]: [
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.RETURNED,
      ],
      [ShipmentStatus.DELIVERED]: [ShipmentStatus.RETURNED],
      [ShipmentStatus.RETURNED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid shipment status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Shipping Zones Operations
  // ---------------------------------------------------------------------------

  async createZone(dto: CreateShippingZoneDto): Promise<ShippingZoneResponseDto> {
    const existing = await this.prisma.shippingZone.findFirst({
      where: { name: { equals: dto.name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `A shipping zone with name '${dto.name.trim()}' already exists`,
      );
    }

    const zone = await this.prisma.shippingZone.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
      },
      include: {
        _count: { select: { methods: true } },
      },
    });

    return this.mapZone(zone);
  }

  async getAllZones(includeInactive = false): Promise<ShippingZoneResponseDto[]> {
    const where: Prisma.ShippingZoneWhereInput = includeInactive
      ? {}
      : { isActive: true };

    const zones = await this.prisma.shippingZone.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { methods: true } },
      },
    });

    return zones.map((z) => this.mapZone(z));
  }

  async getZoneById(id: string): Promise<ShippingZoneResponseDto & { methods: ShippingMethodResponseDto[] }> {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { id },
      include: {
        methods: {
          orderBy: [{ sortOrder: 'asc' }, { cost: 'asc' }],
        },
        _count: { select: { methods: true } },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Shipping zone with ID '${id}' not found`);
    }

    return {
      ...this.mapZone(zone),
      methods: (zone.methods || []).map((m) => this.mapMethod({ ...m, zone: { name: zone.name } })),
    };
  }

  async updateZone(
    id: string,
    dto: UpdateShippingZoneDto,
  ): Promise<ShippingZoneResponseDto> {
    const zone = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Shipping zone with ID '${id}' not found`);
    }

    if (dto.name && dto.name.trim() !== zone.name) {
      const conflict = await this.prisma.shippingZone.findFirst({
        where: {
          id: { not: id },
          name: { equals: dto.name.trim(), mode: 'insensitive' },
        },
      });
      if (conflict) {
        throw new BadRequestException(
          `A shipping zone with name '${dto.name.trim()}' already exists`,
        );
      }
    }

    const updated = await this.prisma.shippingZone.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description?.trim() || null : undefined,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      include: {
        _count: { select: { methods: true } },
      },
    });

    return this.mapZone(updated);
  }

  async deleteZone(id: string): Promise<{ success: boolean; message: string }> {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { id },
      include: { _count: { select: { methods: true } } },
    });

    if (!zone) {
      throw new NotFoundException(`Shipping zone with ID '${id}' not found`);
    }

    await this.prisma.shippingZone.delete({ where: { id } });
    return {
      success: true,
      message: `Shipping zone '${zone.name}' and associated methods deleted successfully`,
    };
  }

  // ---------------------------------------------------------------------------
  // Shipping Methods Operations
  // ---------------------------------------------------------------------------

  async createMethod(dto: CreateShippingMethodDto): Promise<ShippingMethodResponseDto> {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException(`Shipping zone with ID '${dto.zoneId}' not found`);
    }

    const method = await this.prisma.shippingMethod.create({
      data: {
        zoneId: dto.zoneId,
        name: dto.name.trim(),
        cost: dto.cost,
        estimatedDays: dto.estimatedDays !== undefined ? dto.estimatedDays : 3,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
      },
      include: {
        zone: { select: { name: true } },
      },
    });

    return this.mapMethod(method);
  }

  async getAllMethods(query?: {
    zoneId?: string;
    includeInactive?: boolean;
  }): Promise<ShippingMethodResponseDto[]> {
    const where: Prisma.ShippingMethodWhereInput = {};
    if (query?.zoneId) {
      where.zoneId = query.zoneId;
    }
    if (!query?.includeInactive) {
      where.isActive = true;
    }

    const methods = await this.prisma.shippingMethod.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { cost: 'asc' }],
      include: {
        zone: { select: { name: true } },
      },
    });

    return methods.map((m) => this.mapMethod(m));
  }

  async getMethodById(id: string): Promise<ShippingMethodResponseDto> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
      include: {
        zone: { select: { name: true } },
      },
    });

    if (!method) {
      throw new NotFoundException(`Shipping method with ID '${id}' not found`);
    }

    return this.mapMethod(method);
  }

  async updateMethod(
    id: string,
    dto: UpdateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const method = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) {
      throw new NotFoundException(`Shipping method with ID '${id}' not found`);
    }

    if (dto.zoneId && dto.zoneId !== method.zoneId) {
      const zone = await this.prisma.shippingZone.findUnique({
        where: { id: dto.zoneId },
      });
      if (!zone) {
        throw new NotFoundException(`Shipping zone with ID '${dto.zoneId}' not found`);
      }
    }

    const updated = await this.prisma.shippingMethod.update({
      where: { id },
      data: {
        zoneId: dto.zoneId,
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        cost: dto.cost !== undefined ? dto.cost : undefined,
        estimatedDays: dto.estimatedDays !== undefined ? dto.estimatedDays : undefined,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      include: {
        zone: { select: { name: true } },
      },
    });

    return this.mapMethod(updated);
  }

  async deleteMethod(id: string): Promise<{ success: boolean; message: string }> {
    const method = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) {
      throw new NotFoundException(`Shipping method with ID '${id}' not found`);
    }

    await this.prisma.shippingMethod.delete({ where: { id } });
    return {
      success: true,
      message: `Shipping method '${method.name}' deleted successfully`,
    };
  }

  // ---------------------------------------------------------------------------
  // Shipments Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a shipment dispatch package for an eligible order
   */
  async createShipment(
    dto: CreateShipmentDto,
    adminUserId?: string,
  ): Promise<ShipmentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' not found`);
    }

    if (
      order.orderStatus === OrderStatus.CANCELLED ||
      order.orderStatus === OrderStatus.RETURNED
    ) {
      throw new BadRequestException(
        `Cannot create shipment for an order with status '${order.orderStatus}'`,
      );
    }

    if (order.orderStatus === OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order must be CONFIRMED or PROCESSING before creating a shipment. Current status: '${order.orderStatus}'. Please confirm the order first.`,
      );
    }

    if (dto.shippingMethodId) {
      const method = await this.prisma.shippingMethod.findUnique({
        where: { id: dto.shippingMethodId },
      });
      if (!method) {
        throw new NotFoundException(
          `Shipping method with ID '${dto.shippingMethodId}' not found`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Shipment record
      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          courierName: dto.courierName.trim(),
          trackingNumber: dto.trackingNumber?.trim() || null,
          trackingUrl: dto.trackingUrl?.trim() || null,
          shippingMethodId: dto.shippingMethodId || null,
          status: ShipmentStatus.PREPARING,
          notes: dto.notes?.trim() || null,
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: ShipmentStatus.PREPARING,
              notes: dto.notes?.trim() || 'Shipment created / packing initiated',
              changedByUserId: adminUserId || null,
            },
          },
        },
        include: {
          order: true,
          shippingMethod: true,
          statusHistory: {
            include: { changedByUser: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // 2. Align order shipment status if currently UNFULFILLED
      if (order.shipmentStatus === ShipmentStatus.UNFULFILLED) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            shipmentStatus: ShipmentStatus.PREPARING,
            orderStatus:
              order.orderStatus === OrderStatus.CONFIRMED
                ? OrderStatus.PROCESSING
                : undefined,
          },
        });
      }

      return this.mapShipment(shipment);
    });
  }

  /**
   * Paginated query for admin shipment overview
   */
  async getAdminShipments(
    query: QueryShipmentsDto,
  ): Promise<PaginatedShipmentsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.courierName && query.courierName.trim()) {
      where.courierName = {
        contains: query.courierName.trim(),
        mode: 'insensitive',
      };
    }

    if (query.orderId) {
      where.orderId = query.orderId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { trackingNumber: { contains: term, mode: 'insensitive' } },
        { courierName: { contains: term, mode: 'insensitive' } },
        { order: { orderNumber: { contains: term, mode: 'insensitive' } } },
        { order: { recipientName: { contains: term, mode: 'insensitive' } } },
        { order: { recipientPhone: { contains: term, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Prisma.ShipmentOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'status') {
      orderBy = { status: query.sortOrder || 'asc' };
    } else if (query.sortBy === 'courierName') {
      orderBy = { courierName: query.sortOrder || 'asc' };
    } else if (query.sortBy === 'shippedAt') {
      orderBy = { shippedAt: query.sortOrder || 'desc' };
    } else {
      orderBy = { createdAt: query.sortOrder || 'desc' };
    }

    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          order: true,
          shippingMethod: true,
          statusHistory: {
            include: { changedByUser: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    return {
      data: shipments.map((s) => this.mapShipment(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Single shipment details by ID
   */
  async getShipmentById(id: string): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
            user: { select: { name: true, email: true } },
          },
        },
        shippingMethod: true,
        statusHistory: {
          include: { changedByUser: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID '${id}' not found`);
    }

    return this.mapShipment(shipment);
  }

  /**
   * Transition shipment status with fulfillment synchronization
   */
  async updateShipmentStatus(
    id: string,
    dto: UpdateShipmentStatusDto,
    adminUserId?: string,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID '${id}' not found`);
    }

    const prevStatus = shipment.status;
    const targetStatus = dto.status;

    if (prevStatus !== targetStatus) {
      this.validateStatusTransition(prevStatus, targetStatus);
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.ShipmentUpdateInput = {
        status: targetStatus,
      };

      if (dto.trackingNumber !== undefined) {
        updateData.trackingNumber = dto.trackingNumber?.trim() || null;
      }
      if (dto.trackingUrl !== undefined) {
        updateData.trackingUrl = dto.trackingUrl?.trim() || null;
      }

      const now = new Date();

      if (
        (targetStatus === ShipmentStatus.DISPATCHED ||
          targetStatus === ShipmentStatus.IN_TRANSIT) &&
        !shipment.shippedAt
      ) {
        updateData.shippedAt = now;
      }

      if (targetStatus === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
        updateData.deliveredAt = now;
      }

      // Update shipment
      await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData,
      });

      // Log status transition history if changed
      if (prevStatus !== targetStatus) {
        await tx.shipmentStatusHistory.create({
          data: {
            shipmentId: shipment.id,
            fromStatus: prevStatus,
            toStatus: targetStatus,
            notes: dto.notes?.trim() || null,
            changedByUserId: adminUserId || null,
          },
        });

        // ---------------------------------------------------------------------
        // Order Synchronization & Stock Deduction Coupling
        // ---------------------------------------------------------------------
        const order = shipment.order;
        if (order) {
          const orderUpdateData: Prisma.OrderUpdateInput = {
            shipmentStatus: targetStatus,
          };

          if (
            targetStatus === ShipmentStatus.DISPATCHED ||
            targetStatus === ShipmentStatus.IN_TRANSIT
          ) {
            // When dispatched, mark order as SHIPPED and fulfill stock if not already SHIPPED
            if (
              order.orderStatus === OrderStatus.CONFIRMED ||
              order.orderStatus === OrderStatus.PROCESSING
            ) {
              orderUpdateData.orderStatus = OrderStatus.SHIPPED;

              // Deduct physical inventory & clear reserved balance
              for (const item of order.items) {
                if (item.variantId) {
                  await this.inventoryService.fulfillReservedStock(
                    item.variantId,
                    item.quantity,
                    order.id,
                    tx,
                  );
                }
              }

              // Record OrderStatusHistory
              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: order.orderStatus,
                  toStatus: OrderStatus.SHIPPED,
                  notes: `Shipment dispatched via ${shipment.courierName}${dto.trackingNumber ? ` (Tracking: ${dto.trackingNumber})` : ''}`,
                  changedByUserId: adminUserId || null,
                },
              });
            }
          } else if (targetStatus === ShipmentStatus.DELIVERED) {
            // When delivered, mark order as DELIVERED if not cancelled or returned
            if (
              order.orderStatus !== OrderStatus.CANCELLED &&
              order.orderStatus !== OrderStatus.RETURNED &&
              order.orderStatus !== OrderStatus.DELIVERED
            ) {
              orderUpdateData.orderStatus = OrderStatus.DELIVERED;

              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: order.orderStatus,
                  toStatus: OrderStatus.DELIVERED,
                  notes: `Package delivered to customer via ${shipment.courierName}`,
                  changedByUserId: adminUserId || null,
                },
              });
            }
          }

          await tx.order.update({
            where: { id: order.id },
            data: orderUpdateData,
          });
        }
      }

      const updated = await tx.shipment.findUniqueOrThrow({
        where: { id: shipment.id },
        include: {
          order: true,
          shippingMethod: true,
          statusHistory: {
            include: { changedByUser: { select: { name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return this.mapShipment(updated);
    });
  }

  /**
   * Update shipment metadata (courier, tracking, notes)
   */
  async updateShipmentDetails(
    id: string,
    dto: UpdateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID '${id}' not found`);
    }

    if (dto.shippingMethodId) {
      const method = await this.prisma.shippingMethod.findUnique({
        where: { id: dto.shippingMethodId },
      });
      if (!method) {
        throw new NotFoundException(
          `Shipping method with ID '${dto.shippingMethodId}' not found`,
        );
      }
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        courierName: dto.courierName !== undefined ? dto.courierName.trim() : undefined,
        trackingNumber:
          dto.trackingNumber !== undefined
            ? dto.trackingNumber?.trim() || null
            : undefined,
        trackingUrl:
          dto.trackingUrl !== undefined ? dto.trackingUrl?.trim() || null : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() || null : undefined,
        shippingMethodId: dto.shippingMethodId,
      },
      include: {
        order: true,
        shippingMethod: true,
        statusHistory: {
          include: { changedByUser: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.mapShipment(updated);
  }

  // ---------------------------------------------------------------------------
  // Customer & Public Tracking Operations
  // ---------------------------------------------------------------------------

  /**
   * Retrieve shipments linked to customer's order
   */
  async getCustomerShipmentsForOrder(
    userId: string,
    orderId: string,
  ): Promise<ShipmentResponseDto[]> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        shippingMethod: true,
        statusHistory: {
          include: { changedByUser: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return shipments.map((s) => this.mapShipment(s));
  }

  /**
   * Public tracking lookup by courier tracking number
   */
  async getPublicTracking(trackingNumber: string): Promise<PublicTrackingResponseDto> {
    const term = trackingNumber.trim();
    if (!term) {
      throw new BadRequestException('Tracking number is required');
    }

    const shipment = await this.prisma.shipment.findFirst({
      where: {
        trackingNumber: { equals: term, mode: 'insensitive' },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(
        `No shipment found matching tracking number '${term}'`,
      );
    }

    const statusHistory = (shipment.statusHistory || []).map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes || null,
      createdAt: h.createdAt,
    }));

    return {
      trackingNumber: shipment.trackingNumber || term,
      courierName: shipment.courierName,
      status: shipment.status,
      trackingUrl: shipment.trackingUrl || null,
      shippedAt: shipment.shippedAt || null,
      deliveredAt: shipment.deliveredAt || null,
      statusHistory,
    };
  }
}
