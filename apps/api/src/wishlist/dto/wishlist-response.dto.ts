import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WishlistProductSummaryDto {
  @ApiProperty({ example: 'c8a4d2e1-45b7-4c8d-91ef-7b6a5e123456' })
  id!: string;

  @ApiProperty({ example: 'Apple MacBook Pro 16 M3 Max' })
  title!: string;

  @ApiProperty({ example: 'apple-macbook-pro-16-m3-max' })
  slug!: string;

  @ApiPropertyOptional({ example: 'High-performance creator laptop' })
  shortDescription?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: true })
  isFeatured!: boolean;

  @ApiProperty({
    example: false,
    description: 'True if product is deactivated/archived or has no active purchasable variants',
  })
  isUnavailable!: boolean;

  @ApiProperty({ example: 'Laptops' })
  categoryName!: string;

  @ApiProperty({ example: 'laptops' })
  categorySlug!: string;

  @ApiPropertyOptional({ example: 'Apple' })
  brandName?: string | null;

  @ApiProperty({ example: 'https://images.unsplash.com/...' })
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  defaultVariantId?: string | null;

  @ApiPropertyOptional({ example: 'MBP16-M3MAX' })
  sku?: string | null;

  @ApiProperty({ example: 349000.0 })
  regularPrice!: number;

  @ApiPropertyOptional({ example: 315000.0 })
  salePrice?: number | null;

  @ApiProperty({ example: 315000.0 })
  effectivePrice!: number;

  @ApiPropertyOptional({ example: 10 })
  discountPercent?: number | null;

  @ApiProperty({ example: true })
  inStock!: boolean;

  @ApiProperty({ example: 8 })
  availableQuantity!: number;

  @ApiProperty({ example: 4.9 })
  rating!: number;

  @ApiProperty({ example: 24 })
  reviewsCount!: number;
}

export class WishlistItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'c8a4d2e1-45b7-4c8d-91ef-7b6a5e123456' })
  productId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: WishlistProductSummaryDto })
  product!: WishlistProductSummaryDto;
}
