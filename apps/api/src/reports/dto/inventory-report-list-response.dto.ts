import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryReportRecordDto {
  @ApiProperty({ example: 'variant-uuid-1' })
  variantId: string;

  @ApiProperty({ example: 'IPH15-PRO-256-TI' })
  sku: string;

  @ApiPropertyOptional({ example: '194253123456' })
  barcode?: string;

  @ApiProperty({ example: 'product-uuid-1' })
  productId: string;

  @ApiProperty({ example: 'Apple iPhone 15 Pro Max' })
  productTitle: string;

  @ApiProperty({ example: 'apple-iphone-15-pro-max' })
  productSlug: string;

  @ApiProperty({ example: 'Apple iPhones' })
  categoryName: string;

  @ApiPropertyOptional({ example: 'Apple' })
  brandName?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Regular list price', example: 159999.0 })
  regularPrice: number;

  @ApiPropertyOptional({ description: 'Active discounted sale price if set', example: 154999.0 })
  salePrice?: number;

  @ApiProperty({ description: 'Effective selling price used for current sales', example: 154999.0 })
  effectivePrice: number;

  @ApiProperty({ description: 'Total on-hand physical stock in warehouse', example: 12 })
  quantity: number;

  @ApiProperty({ description: 'Stock reserved in pending checkout orders', example: 2 })
  reservedQuantity: number;

  @ApiProperty({ description: 'Available stock ready for immediate purchase', example: 10 })
  availableQuantity: number;

  @ApiProperty({ description: 'Threshold triggering low stock alert', example: 5 })
  lowStockThreshold: number;

  @ApiProperty({
    description: 'Stock status condition',
    enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
    example: 'IN_STOCK',
  })
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

  @ApiProperty({ description: 'Total line item valuation based on regular price', example: 1919988.0 })
  totalValuation: number;

  @ApiPropertyOptional({ description: 'Formatted variant attribute combinations', example: 'Color: Titanium, Storage: 256GB' })
  attributes?: string;

  @ApiProperty({ description: 'Timestamp of last inventory balance or record update' })
  updatedAt: string;
}

export class InventoryReportListResponseDto {
  @ApiProperty({ type: [InventoryReportRecordDto] })
  items: InventoryReportRecordDto[];

  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  limit: number;

  @ApiProperty({ example: 8 })
  totalPages: number;
}
