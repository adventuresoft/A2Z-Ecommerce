import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class InventoryStockStatusMetricDto {
  @ApiProperty({ example: 'IN_STOCK', enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] })
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

  @ApiProperty({ description: 'Number of variants with this status', example: 98 })
  count: number;

  @ApiProperty({ description: 'Percentage of total variants', example: 81.67 })
  percentage: number;

  @ApiProperty({ description: 'Total on-hand physical units in this status', example: 3200 })
  totalUnits: number;

  @ApiProperty({ description: 'Total inventory valuation in this status', example: 4000000 })
  totalValuation: number;
}

export class InventoryCategoryMetricDto {
  @ApiProperty({ example: 'a1b2c3d4-uuid' })
  categoryId: string;

  @ApiProperty({ example: 'Smartphones & Tablets' })
  categoryName: string;

  @ApiProperty({ description: 'Number of distinct variant SKUs in category', example: 24 })
  skuCount: number;

  @ApiProperty({ description: 'Total physical units in category', example: 520 })
  totalUnits: number;

  @ApiProperty({ description: 'Total available units in category', example: 505 })
  availableUnits: number;

  @ApiProperty({ description: 'Total reserved units in category', example: 15 })
  reservedUnits: number;

  @ApiProperty({ description: 'Total inventory valuation in category', example: 1250000 })
  totalValuation: number;

  @ApiProperty({ description: 'Percentage of total warehouse valuation', example: 29.76 })
  percentage: number;
}

export class InventoryBrandMetricDto {
  @ApiPropertyOptional({ example: 'brand-uuid-123' })
  brandId?: string;

  @ApiProperty({ example: 'Samsung' })
  brandName: string;

  @ApiProperty({ description: 'Number of variant SKUs for brand', example: 18 })
  skuCount: number;

  @ApiProperty({ description: 'Total physical units for brand', example: 410 })
  totalUnits: number;

  @ApiProperty({ description: 'Total available units for brand', example: 395 })
  availableUnits: number;

  @ApiProperty({ description: 'Total reserved units for brand', example: 15 })
  reservedUnits: number;

  @ApiProperty({ description: 'Total inventory valuation for brand', example: 980000 })
  totalValuation: number;

  @ApiProperty({ description: 'Percentage of total warehouse valuation', example: 23.33 })
  percentage: number;
}

export class StockMovementTypeMetricDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.RESTOCK })
  type: StockMovementType;

  @ApiProperty({ description: 'Total number of ledger transactions of this type', example: 35 })
  count: number;

  @ApiProperty({ description: 'Total units added by this movement type', example: 250 })
  quantityIn: number;

  @ApiProperty({ description: 'Total units deducted by this movement type', example: 0 })
  quantityOut: number;

  @ApiProperty({ description: 'Net units impact on warehouse balance', example: 250 })
  netQuantity: number;
}

export class TopMoverItemDto {
  @ApiProperty({ example: 'variant-uuid-1' })
  variantId: string;

  @ApiProperty({ example: 'IPH15-PRO-256-TI' })
  sku: string;

  @ApiProperty({ example: 'Apple iPhone 15 Pro Max' })
  productTitle: string;

  @ApiProperty({ example: 'Apple iPhones' })
  categoryName: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Current available on-hand stock', example: 14 })
  currentQuantity: number;

  @ApiProperty({ description: 'Total units deducted/sold during selected period', example: 68 })
  unitsDeducted: number;

  @ApiProperty({ description: 'Number of movement transactions during selected period', example: 12 })
  movementCount: number;
}

export class CriticalAlertItemDto {
  @ApiProperty({ example: 'variant-uuid-2' })
  variantId: string;

  @ApiProperty({ example: 'SAM-S24U-512-TI' })
  sku: string;

  @ApiProperty({ example: 'Samsung Galaxy S24 Ultra' })
  productTitle: string;

  @ApiProperty({ example: 'Android Smartphones' })
  categoryName: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Current physical on-hand quantity', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Units reserved in pending customer orders', example: 2 })
  reservedQuantity: number;

  @ApiProperty({ description: 'Available quantity ready for sale', example: 0 })
  availableQuantity: number;

  @ApiProperty({ description: 'Configured low-stock alert threshold', example: 5 })
  lowStockThreshold: number;

  @ApiProperty({ description: 'Deficit units required to restore threshold', example: 5 })
  deficit: number;

  @ApiProperty({ enum: ['LOW_STOCK', 'OUT_OF_STOCK'], example: 'OUT_OF_STOCK' })
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}
