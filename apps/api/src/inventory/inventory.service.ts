import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockMovementType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AdjustStockDto,
  InventoryItemDto,
  LowStockSummaryDto,
  PaginatedInventoryResponseDto,
  PaginatedMovementsResponseDto,
  QueryInventoryDto,
  QueryMovementsDto,
  StockMovementResponseDto,
} from './dto/index.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to map a raw Prisma inventory record with relations into an InventoryItemDto
   */
  private mapInventoryItem(inv: any): InventoryItemDto {
    const variant = inv.variant;
    const product = variant?.product;
    const available = inv.quantity - inv.reservedQuantity;

    const attributes = (variant?.attributes || []).map((attrRel: any) => ({
      name: attrRel.attributeValue?.attribute?.name || '',
      value: attrRel.attributeValue?.value || '',
      colorCode: attrRel.attributeValue?.colorCode || null,
    }));

    const thumbnailUrl =
      variant?.imageUrl ||
      variant?.image?.imageUrl ||
      product?.thumbnailUrl ||
      null;

    return {
      id: inv.id,
      variantId: inv.variantId,
      sku: variant?.sku || '',
      barcode: variant?.barcode || null,
      productTitle: product?.title || '',
      productId: variant?.productId || '',
      categoryName: product?.category?.name || null,
      thumbnailUrl,
      attributes,
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity: available,
      lowStockThreshold: inv.lowStockThreshold,
      isLowStock: available <= inv.lowStockThreshold,
      isOutOfStock: available <= 0,
      updatedAt: inv.updatedAt,
    };
  }

  /**
   * Helper to map a raw Prisma StockMovement record into a StockMovementResponseDto
   */
  private mapMovementItem(m: any): StockMovementResponseDto {
    return {
      id: m.id,
      variantId: m.variantId,
      sku: m.variant?.sku || '',
      productTitle: m.variant?.product?.title || '',
      type: m.type,
      quantityChange: m.quantityChange,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      referenceId: m.referenceId || null,
      notes: m.notes || null,
      performedByUserName: m.performedByUser?.name || null,
      createdAt: m.createdAt,
    };
  }

  /**
   * Query paginated inventory balances with search and filters
   */
  async getInventoryOverview(
    query: QueryInventoryDto,
  ): Promise<PaginatedInventoryResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {};

    const variantWhere: Prisma.ProductVariantWhereInput = {};

    // Search filter across variant SKU, barcode, or product title
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      variantWhere.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { product: { title: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // Category filter
    if (query.categoryId) {
      variantWhere.product = {
        categoryId: query.categoryId,
      };
    }

    if (Object.keys(variantWhere).length > 0) {
      where.variant = variantWhere;
    }

    const include = {
      variant: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
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
      },
    };

    // Low-stock / out-of-stock custom filtering
    // Since availableQuantity = quantity - reservedQuantity <= lowStockThreshold requires cross-column logic,
    // we query and filter or use database raw where appropriate.
    if (query.outOfStock) {
      // Out of stock where quantity <= reservedQuantity
      const records = await this.prisma.inventory.findMany({
        where,
        include,
        orderBy: { updatedAt: 'desc' },
      });
      const filtered = records.filter(
        (r) => r.quantity - r.reservedQuantity <= 0,
      );
      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);

      return {
        data: paginated.map((inv) => this.mapInventoryItem(inv)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    if (query.lowStock) {
      // Low stock where quantity - reservedQuantity <= lowStockThreshold
      const records = await this.prisma.inventory.findMany({
        where,
        include,
        orderBy: { updatedAt: 'desc' },
      });
      const filtered = records.filter(
        (r) => r.quantity - r.reservedQuantity <= r.lowStockThreshold,
      );
      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);

      return {
        data: paginated.map((inv) => this.mapInventoryItem(inv)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Standard paginated query
    let orderBy: Prisma.InventoryOrderByWithRelationInput = {
      updatedAt: query.sortOrder || 'desc',
    };
    if (query.sortBy === 'quantity') {
      orderBy = { quantity: query.sortOrder || 'desc' };
    } else if (query.sortBy === 'sku') {
      orderBy = { variant: { sku: query.sortOrder || 'asc' } };
    }

    const [total, items] = await Promise.all([
      this.prisma.inventory.count({ where }),
      this.prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
    ]);

    return {
      data: items.map((inv) => this.mapInventoryItem(inv)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single variant inventory status
   */
  async getVariantInventory(variantId: string): Promise<InventoryItemDto> {
    let inv = await this.prisma.inventory.findUnique({
      where: { variantId },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
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
        },
      },
    });

    if (!inv) {
      // Check if variant exists
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        throw new NotFoundException(
          `Product variant with ID '${variantId}' not found`,
        );
      }

      // Initialize default inventory record
      await this.prisma.inventory.create({
        data: {
          variantId,
          quantity: 0,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      });

      inv = await this.prisma.inventory.findUniqueOrThrow({
        where: { variantId },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
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
          },
        },
      });
    }

    return this.mapInventoryItem(inv);
  }

  /**
   * Execute concurrency-safe stock adjustment with row-level lock and audit ledger
   */
  async adjustStock(
    dto: AdjustStockDto,
    userId?: string,
  ): Promise<InventoryItemDto> {
    const { variantId, type, quantityChange, referenceId, notes } = dto;

    await this.prisma.$transaction(async (tx) => {
      // 1. Lock the inventory row using pessimistic locking (FOR UPDATE)
      let rows = await tx.$queryRaw<
        Array<{
          id: string;
          variantId: string;
          quantity: number;
          reservedQuantity: number;
          lowStockThreshold: number;
        }>
      >`SELECT id, "variantId", quantity, "reservedQuantity", "lowStockThreshold" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;

      if (!rows || rows.length === 0) {
        const variantExists = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { id: true },
        });
        if (!variantExists) {
          throw new NotFoundException(
            `Product variant with ID '${variantId}' not found`,
          );
        }

        await tx.inventory.create({
          data: {
            variantId,
            quantity: 0,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          },
        });

        rows = await tx.$queryRaw<
          Array<{
            id: string;
            variantId: string;
            quantity: number;
            reservedQuantity: number;
            lowStockThreshold: number;
          }>
        >`SELECT id, "variantId", quantity, "reservedQuantity", "lowStockThreshold" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;
      }

      const current = rows[0];
      const previousQuantity = current.quantity;
      const reservedQuantity = current.reservedQuantity;
      const newQuantity = previousQuantity + quantityChange;

      // Invariant checks
      if (newQuantity < 0) {
        throw new BadRequestException(
          `Adjustment of ${quantityChange} would reduce stock to ${newQuantity}. Physical quantity cannot be negative (current: ${previousQuantity}).`,
        );
      }

      if (newQuantity < reservedQuantity) {
        throw new BadRequestException(
          `Cannot reduce physical quantity to ${newQuantity} because ${reservedQuantity} units are currently reserved for pending orders.`,
        );
      }

      // 2. Update Inventory balance
      await tx.inventory.update({
        where: { variantId },
        data: {
          quantity: newQuantity,
        },
      });

      // 3. Record immutable StockMovement ledger entry
      await tx.stockMovement.create({
        data: {
          variantId,
          type,
          quantityChange,
          previousQuantity,
          newQuantity,
          referenceId: referenceId?.trim() || null,
          notes: notes?.trim() || null,
          performedByUserId: userId || null,
        },
      });
    });

    return this.getVariantInventory(variantId);
  }

  /**
   * Update low-stock threshold for a variant
   */
  async updateThreshold(
    variantId: string,
    lowStockThreshold: number,
  ): Promise<InventoryItemDto> {
    await this.getVariantInventory(variantId); // ensures record exists
    await this.prisma.inventory.update({
      where: { variantId },
      data: { lowStockThreshold },
    });
    return this.getVariantInventory(variantId);
  }

  /**
   * Retrieve paginated immutable stock movement audit ledger
   */
  async getStockMovements(
    query: QueryMovementsDto,
  ): Promise<PaginatedMovementsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};

    if (query.variantId) {
      where.variantId = query.variantId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.referenceId && query.referenceId.trim()) {
      where.referenceId = {
        contains: query.referenceId.trim(),
        mode: 'insensitive',
      };
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

    const [total, items] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            include: {
              product: {
                select: { title: true },
              },
            },
          },
          performedByUser: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      data: items.map((m) => this.mapMovementItem(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve low-stock alerts overview summary
   */
  async getLowStockAlerts(limit = 20): Promise<LowStockSummaryDto> {
    const [allInventory, totalVariants] = await Promise.all([
      this.prisma.inventory.findMany({
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
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
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.productVariant.count(),
    ]);

    const lowStockItems: InventoryItemDto[] = [];
    let outOfStockCount = 0;
    let lowStockCount = 0;

    for (const inv of allInventory) {
      const available = inv.quantity - inv.reservedQuantity;
      if (available <= 0) {
        outOfStockCount++;
        lowStockCount++;
        lowStockItems.push(this.mapInventoryItem(inv));
      } else if (available <= inv.lowStockThreshold) {
        lowStockCount++;
        lowStockItems.push(this.mapInventoryItem(inv));
      }
    }

    return {
      totalVariants,
      lowStockCount,
      outOfStockCount,
      items: lowStockItems.slice(0, limit),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Stock Reservation Helpers for Future Order / Checkout Pipeline
  // ---------------------------------------------------------------------------

  /**
   * Concurrency-safe stock reservation during checkout order placement
   */
  async reserveStock(
    variantId: string,
    quantity: number,
    orderId?: string,
    existingTx?: Prisma.TransactionClient,
  ): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          variantId: string;
          quantity: number;
          reservedQuantity: number;
        }>
      >`SELECT id, "variantId", quantity, "reservedQuantity" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;

      if (!rows || rows.length === 0) {
        throw new NotFoundException(
          `Inventory record for variant '${variantId}' not found`,
        );
      }

      const inv = rows[0];
      const available = inv.quantity - inv.reservedQuantity;
      if (available < quantity) {
        throw new BadRequestException(
          `Insufficient stock available for variant '${variantId}'. Requested: ${quantity}, Available: ${available}`,
        );
      }

      const newReserved = inv.reservedQuantity + quantity;
      await tx.inventory.update({
        where: { variantId },
        data: { reservedQuantity: newReserved },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.PURCHASE_RESERVE,
          quantityChange: 0,
          previousQuantity: inv.quantity,
          newQuantity: inv.quantity,
          referenceId: orderId || null,
          notes: `Stock reserved for checkout: ${quantity} units (Total reserved: ${newReserved})`,
        },
      });
    };

    if (existingTx) {
      await execute(existingTx);
    } else {
      await this.prisma.$transaction(execute);
    }
  }

  /**
   * Release reserved stock on order cancellation or expired cart checkout
   */
  async releaseReservedStock(
    variantId: string,
    quantity: number,
    orderId?: string,
    existingTx?: Prisma.TransactionClient,
  ): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          variantId: string;
          quantity: number;
          reservedQuantity: number;
        }>
      >`SELECT id, "variantId", quantity, "reservedQuantity" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;

      if (!rows || rows.length === 0) {
        return;
      }

      const inv = rows[0];
      const newReserved = Math.max(0, inv.reservedQuantity - quantity);

      await tx.inventory.update({
        where: { variantId },
        data: { reservedQuantity: newReserved },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.CANCEL_RESTORE,
          quantityChange: 0,
          previousQuantity: inv.quantity,
          newQuantity: inv.quantity,
          referenceId: orderId || null,
          notes: `Reserved stock released: ${quantity} units (Total reserved: ${newReserved})`,
        },
      });
    };

    if (existingTx) {
      await execute(existingTx);
    } else {
      await this.prisma.$transaction(execute);
    }
  }

  /**
   * Fulfill reserved stock when an order is packed/shipped (deducts physical + reserved)
   */
  async fulfillReservedStock(
    variantId: string,
    quantity: number,
    orderId?: string,
    existingTx?: Prisma.TransactionClient,
  ): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          variantId: string;
          quantity: number;
          reservedQuantity: number;
        }>
      >`SELECT id, "variantId", quantity, "reservedQuantity" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;

      if (!rows || rows.length === 0) {
        throw new NotFoundException(
          `Inventory record for variant '${variantId}' not found`,
        );
      }

      const inv = rows[0];
      const previousQuantity = inv.quantity;
      const newQuantity = Math.max(0, previousQuantity - quantity);
      const newReserved = Math.max(0, inv.reservedQuantity - quantity);

      await tx.inventory.update({
        where: { variantId },
        data: {
          quantity: newQuantity,
          reservedQuantity: newReserved,
        },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          type: StockMovementType.ORDER_FULFILL,
          quantityChange: -quantity,
          previousQuantity,
          newQuantity,
          referenceId: orderId || null,
          notes: `Order fulfilled and dispatched: ${quantity} units deducted`,
        },
      });
    };

    if (existingTx) {
      await execute(existingTx);
    } else {
      await this.prisma.$transaction(execute);
    }
  }

  /**
   * Replenish stock when an order or item is returned
   */
  async restoreStock(
    variantId: string,
    quantity: number,
    reason: StockMovementType = StockMovementType.RETURN_RESTORE,
    orderId?: string,
    existingTx?: Prisma.TransactionClient,
  ): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          variantId: string;
          quantity: number;
          reservedQuantity: number;
        }>
      >`SELECT id, "variantId", quantity, "reservedQuantity" FROM "Inventory" WHERE "variantId" = ${variantId} FOR UPDATE`;

      if (!rows || rows.length === 0) {
        throw new NotFoundException(
          `Inventory record for variant '${variantId}' not found`,
        );
      }

      const inv = rows[0];
      const previousQuantity = inv.quantity;
      const newQuantity = previousQuantity + quantity;

      await tx.inventory.update({
        where: { variantId },
        data: { quantity: newQuantity },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          type: reason,
          quantityChange: quantity,
          previousQuantity,
          newQuantity,
          referenceId: orderId || null,
          notes: `Stock replenished from return: +${quantity} units`,
        },
      });
    };

    if (existingTx) {
      await execute(existingTx);
    } else {
      await this.prisma.$transaction(execute);
    }
  }
}
