import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
  StockMovementType,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import type {
  CancelOrderDto,
  CreateOrderDto,
  OrderResponseDto,
  PaginatedOrdersResponseDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
} from './dto/index.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  private readonly orderIncludes = {
    items: {
      include: {
        variant: {
          include: { image: true, product: true },
        },
      },
    },
    statusHistory: {
      include: {
        changedByUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' as const },
    },
    shipments: {
      orderBy: { createdAt: 'desc' as const },
    },
    payments: {
      orderBy: { createdAt: 'desc' as const },
    },
    refunds: {
      orderBy: { createdAt: 'desc' as const },
    },
    user: { select: { name: true, email: true } },
  };

  /**
   * Generates a unique human-readable order number, e.g. AZ-2026-X8K2M9
   */
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `AZ-${year}-${randomPart}`;
  }

  /**
   * Helper to format variant attributes array into readable string
   */
  private formatAttributes(attributes: any[]): string {
    if (!attributes || attributes.length === 0) return '';
    return attributes
      .map((attrRel: any) => {
        const name = attrRel.attributeValue?.attribute?.name || '';
        const value = attrRel.attributeValue?.value || '';
        return name && value ? `${name}: ${value}` : value;
      })
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Maps raw Prisma order with relations into typed OrderResponseDto
   */
  private mapOrder(order: any): OrderResponseDto {
    const items = (order.items || []).map((item: any) => {
      const thumbnailUrl =
        item.variant?.imageUrl ||
        item.variant?.image?.imageUrl ||
        item.variant?.product?.thumbnailUrl ||
        null;

      return {
        id: item.id,
        variantId: item.variantId,
        productTitle: item.productTitle,
        sku: item.sku,
        variantAttributes: item.variantAttributes,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
        thumbnailUrl,
      };
    });

    const statusHistory = (order.statusHistory || []).map((h: any) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes,
      changedByUserName: h.changedByUser?.name || null,
      createdAt: h.createdAt,
    }));

    const shipments = (order.shipments || []).map((s: any) => ({
      id: s.id,
      courierName: s.courierName,
      trackingNumber: s.trackingNumber || null,
      trackingUrl: s.trackingUrl || null,
      status: s.status,
      shippedAt: s.shippedAt || null,
      deliveredAt: s.deliveredAt || null,
      createdAt: s.createdAt,
    }));

    const payments = (order.payments || []).map((p: any) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amount: Number(p.amount),
      transactionRef: p.transactionRef || null,
      paidAt: p.paidAt || null,
      createdAt: p.createdAt,
    }));

    const refunds = (order.refunds || []).map((r: any) => ({
      id: r.id,
      amount: Number(r.amount),
      status: r.status,
      reason: r.reason,
      transactionRef: r.transactionRef || null,
      createdAt: r.createdAt,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.user?.name || undefined,
      customerEmail: order.user?.email || undefined,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shipmentStatus: order.shipmentStatus,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingFee: Number(order.shippingFee),
      grandTotal: Number(order.grandTotal),
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      shippingStreet: order.shippingStreet,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      customerNotes: order.customerNotes,
      items,
      statusHistory,
      shipments,
      payments,
      refunds,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Validates state transitions for OrderStatus
   */
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    if (currentStatus === newStatus) {
      return;
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Customer Operations
  // ---------------------------------------------------------------------------

  /**
   * Transactional customer checkout order placement
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Consolidate duplicate variant IDs if any
    const itemMap = new Map<string, number>();
    for (const item of dto.items) {
      const current = itemMap.get(item.variantId) || 0;
      itemMap.set(item.variantId, current + item.quantity);
    }

    const variantIds = Array.from(itemMap.keys());

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch all requested variants with product and attribute details
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: true,
          image: true,
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      });

      if (variants.length !== variantIds.length) {
        throw new NotFoundException(
          'One or more requested product variants were not found',
        );
      }

      let subtotal = 0;
      const orderItemsData: Array<{
        variantId: string;
        productTitle: string;
        sku: string;
        variantAttributes: string | null;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
      }> = [];

      for (const variant of variants) {
        if (!variant.isActive) {
          throw new BadRequestException(
            `Variant '${variant.sku}' is currently inactive`,
          );
        }

        const quantity = itemMap.get(variant.id) || 1;
        const price =
          variant.salePrice !== null
            ? Number(variant.salePrice)
            : Number(variant.regularPrice);
        const totalPrice = price * quantity;
        subtotal += totalPrice;

        const variantAttributes =
          this.formatAttributes(variant.attributes) || null;

        orderItemsData.push({
          variantId: variant.id,
          productTitle: variant.product.title,
          sku: variant.sku,
          variantAttributes,
          unitPrice: price,
          quantity,
          totalPrice,
        });
      }

      // Standard delivery fee (flat 60 BDT for default standard shipping)
      const shippingFee = 60.0;
      const discountAmount = 0.0;
      const grandTotal = subtotal + shippingFee - discountAmount;

      // 2. Generate unique order number
      let orderNumber = this.generateOrderNumber();
      let exists = await tx.order.findUnique({ where: { orderNumber } });
      while (exists) {
        orderNumber = this.generateOrderNumber();
        exists = await tx.order.findUnique({ where: { orderNumber } });
      }

      // 3. Create the Order header and OrderItems
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shipmentStatus: ShipmentStatus.UNFULFILLED,
          subtotal,
          discountAmount,
          shippingFee,
          grandTotal,
          recipientName: dto.recipientName.trim(),
          recipientPhone: dto.recipientPhone.trim(),
          shippingStreet: dto.shippingStreet.trim(),
          shippingCity: dto.shippingCity.trim(),
          shippingState: dto.shippingState?.trim() || null,
          shippingPostalCode: dto.shippingPostalCode.trim(),
          customerNotes: dto.customerNotes?.trim() || null,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PENDING,
              notes: 'Order placed by customer',
              changedByUserId: userId,
            },
          },
          payments: {
            create: {
              method: PaymentMethod.CASH_ON_DELIVERY,
              status: PaymentStatus.PENDING,
              amount: grandTotal,
              currency: 'BDT',
              notes: 'Initial Cash on Delivery pending payment record',
            },
          },
        },
      });

      // 4. Reserve inventory for all items in the order
      for (const item of orderItemsData) {
        await this.inventoryService.reserveStock(
          item.variantId,
          item.quantity,
          createdOrder.id,
          tx,
        );
      }

      // 5. Query complete order with relations to return
      const fullOrder = await tx.order.findUniqueOrThrow({
        where: { id: createdOrder.id },
        include: this.orderIncludes,
      });

      return this.mapOrder(fullOrder);
    });
  }

  /**
   * Retrieve paginated order history for authenticated customer
   */
  async getCustomerOrders(
    userId: string,
    query: QueryOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };

    if (query.orderStatus) {
      where.orderStatus = query.orderStatus;
    }
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }
    if (query.shipmentStatus) {
      where.shipmentStatus = query.shipmentStatus;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.orderIncludes,
      }),
    ]);

    return {
      data: orders.map((o) => this.mapOrder(o)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single order details for authenticated customer
   */
  async getCustomerOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: this.orderIncludes,
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    return this.mapOrder(order);
  }

  /**
   * Customer cancellation of an order in PENDING status
   */
  async cancelCustomerOrder(
    userId: string,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order cannot be cancelled because its current status is '${order.orderStatus}'. Only PENDING orders can be cancelled by the customer.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Release reserved stock for each variant
      for (const item of order.items) {
        if (item.variantId) {
          await this.inventoryService.releaseReservedStock(
            item.variantId,
            item.quantity,
            order.id,
            tx,
          );
        }
      }

      // 2. Update order status to CANCELLED
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          statusHistory: {
            create: {
              fromStatus: OrderStatus.PENDING,
              toStatus: OrderStatus.CANCELLED,
              notes: dto.reason?.trim() || 'Cancelled by customer',
              changedByUserId: userId,
            },
          },
        },
      });

      const updated = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: this.orderIncludes,
      });

      return this.mapOrder(updated);
    });
  }

  // ---------------------------------------------------------------------------
  // Administrative Operations
  // ---------------------------------------------------------------------------

  /**
   * Administrative paginated query with search, status filters, and date range
   */
  async getAdminOrders(
    query: QueryOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (query.orderStatus) {
      where.orderStatus = query.orderStatus;
    }
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }
    if (query.shipmentStatus) {
      where.shipmentStatus = query.shipmentStatus;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { recipientName: { contains: term, mode: 'insensitive' } },
        { recipientPhone: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'grandTotal') {
      orderBy = { grandTotal: query.sortOrder || 'desc' };
    } else if (query.sortBy === 'orderNumber') {
      orderBy = { orderNumber: query.sortOrder || 'asc' };
    } else {
      orderBy = { createdAt: query.sortOrder || 'desc' };
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.orderIncludes,
      }),
    ]);

    return {
      data: orders.map((o) => this.mapOrder(o)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve full order details by ID for administrative view
   */
  async getAdminOrderById(orderId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderIncludes,
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    return this.mapOrder(order);
  }

  /**
   * Administrative status transition with validation and stock coupling
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminUserId?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${orderId}' not found`);
    }

    const prevOrderStatus = order.orderStatus;
    const targetOrderStatus = dto.orderStatus;

    if (targetOrderStatus && targetOrderStatus !== prevOrderStatus) {
      this.validateStatusTransition(prevOrderStatus, targetOrderStatus);
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.OrderUpdateInput = {};
      let orderStatusChanged = false;

      if (targetOrderStatus && targetOrderStatus !== prevOrderStatus) {
        updateData.orderStatus = targetOrderStatus;
        orderStatusChanged = true;

        // Stock coupling based on transition target
        if (targetOrderStatus === OrderStatus.SHIPPED) {
          // Fulfill reserved stock: decrement both physical quantity & reserved quantity
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
          if (
            order.shipmentStatus === ShipmentStatus.UNFULFILLED ||
            order.shipmentStatus === ShipmentStatus.PREPARING
          ) {
            updateData.shipmentStatus = ShipmentStatus.DISPATCHED;
          }
        } else if (targetOrderStatus === OrderStatus.CANCELLED) {
          // Release reserved stock back to available warehouse balance
          for (const item of order.items) {
            if (item.variantId) {
              await this.inventoryService.releaseReservedStock(
                item.variantId,
                item.quantity,
                order.id,
                tx,
              );
            }
          }
        } else if (targetOrderStatus === OrderStatus.DELIVERED) {
          updateData.shipmentStatus = ShipmentStatus.DELIVERED;
        } else if (targetOrderStatus === OrderStatus.RETURNED) {
          // If returned after delivery/shipment, replenish warehouse stock
          for (const item of order.items) {
            if (item.variantId) {
              await this.inventoryService.restoreStock(
                item.variantId,
                item.quantity,
                StockMovementType.RETURN_RESTORE,
                order.id,
                tx,
              );
            }
          }
          updateData.shipmentStatus = ShipmentStatus.RETURNED;
        }

        // Add history log for order status transition
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: prevOrderStatus,
            toStatus: targetOrderStatus,
            notes: dto.notes?.trim() || null,
            changedByUserId: adminUserId || null,
          },
        });
      }

      if (dto.paymentStatus && dto.paymentStatus !== order.paymentStatus) {
        updateData.paymentStatus = dto.paymentStatus;
      }

      if (dto.shipmentStatus && dto.shipmentStatus !== order.shipmentStatus) {
        updateData.shipmentStatus = dto.shipmentStatus;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.order.update({
          where: { id: order.id },
          data: updateData,
        });
      }

      const fullUpdated = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: this.orderIncludes,
      });

      return this.mapOrder(fullUpdated);
    });
  }
}
