import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class VariantAttributeSummaryDto {
  @ApiProperty({ example: 'Color' })
  name: string;

  @ApiProperty({ example: 'Navy Blue' })
  value: string;

  @ApiPropertyOptional({ example: '#000080' })
  colorCode?: string | null;
}

export class InventoryItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  variantId: string;

  @ApiProperty({ example: 'TSHIRT-NVY-XL' })
  sku: string;

  @ApiPropertyOptional({ example: '890123456789' })
  barcode: string | null;

  @ApiProperty({ example: 'Classic Cotton Crewneck' })
  productTitle: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  productId: string;

  @ApiPropertyOptional({ example: 'Apparel' })
  categoryName: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/products/tshirt-navy.jpg' })
  thumbnailUrl: string | null;

  @ApiProperty({ type: [VariantAttributeSummaryDto] })
  attributes: VariantAttributeSummaryDto[];

  @ApiProperty({ example: 45, description: 'Physical warehouse quantity on-hand' })
  quantity: number;

  @ApiProperty({ example: 5, description: 'Stock reserved for pending checkout/orders' })
  reservedQuantity: number;

  @ApiProperty({ example: 40, description: 'Sellable available quantity (quantity - reservedQuantity)' })
  availableQuantity: number;

  @ApiProperty({ example: 10, description: 'Threshold triggering low stock alert' })
  lowStockThreshold: number;

  @ApiProperty({ example: false, description: 'True when availableQuantity <= lowStockThreshold' })
  isLowStock: boolean;

  @ApiProperty({ example: false, description: 'True when availableQuantity == 0' })
  isOutOfStock: boolean;

  @ApiProperty({ example: '2026-10-16T12:00:00.000Z' })
  updatedAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class PaginatedInventoryResponseDto {
  @ApiProperty({ type: [InventoryItemDto] })
  data: InventoryItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class StockMovementResponseDto {
  @ApiProperty({ example: 'm1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' })
  id: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  variantId: string;

  @ApiProperty({ example: 'TSHIRT-NVY-XL' })
  sku: string;

  @ApiProperty({ example: 'Classic Cotton Crewneck' })
  productTitle: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.RESTOCK })
  type: StockMovementType;

  @ApiProperty({ example: 50, description: 'Signed delta count (+50, -5)' })
  quantityChange: number;

  @ApiProperty({ example: 10 })
  previousQuantity: number;

  @ApiProperty({ example: 60 })
  newQuantity: number;

  @ApiPropertyOptional({ example: 'PO-2026-1001' })
  referenceId: string | null;

  @ApiPropertyOptional({ example: 'Restock shipment received' })
  notes: string | null;

  @ApiPropertyOptional({ example: 'Super Admin' })
  performedByUserName: string | null;

  @ApiProperty({ example: '2026-10-16T12:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedMovementsResponseDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  data: StockMovementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class LowStockSummaryDto {
  @ApiProperty({ example: 45 })
  totalVariants: number;

  @ApiProperty({ example: 6 })
  lowStockCount: number;

  @ApiProperty({ example: 2 })
  outOfStockCount: number;

  @ApiProperty({ type: [InventoryItemDto] })
  items: InventoryItemDto[];
}
