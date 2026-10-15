import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  imageUrl!: string;

  @ApiPropertyOptional()
  altText?: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class VariantAttributeValueDto {
  @ApiProperty()
  attributeValueId!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiPropertyOptional()
  colorCode?: string | null;

  @ApiProperty()
  attributeName!: string;

  @ApiProperty()
  attributeSlug!: string;
}

export class ProductVariantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional()
  barcode?: string | null;

  @ApiProperty()
  regularPrice!: number;

  @ApiPropertyOptional()
  salePrice?: number | null;

  @ApiPropertyOptional()
  weightGrams?: number | null;

  @ApiPropertyOptional()
  imageId?: string | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: () => ProductImageResponseDto })
  image?: ProductImageResponseDto | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: () => [VariantAttributeValueDto] })
  attributes!: VariantAttributeValueDto[];

  @ApiPropertyOptional()
  productTitle?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ProductCategorySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class ProductBrandSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  shortDescription?: string | null;

  @ApiPropertyOptional()
  thumbnailUrl?: string | null;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty({ type: () => ProductCategorySummaryDto })
  category!: ProductCategorySummaryDto;

  @ApiPropertyOptional()
  brandId?: string | null;

  @ApiPropertyOptional({ type: () => ProductBrandSummaryDto })
  brand?: ProductBrandSummaryDto | null;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: () => [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiProperty({ type: () => [ProductVariantResponseDto] })
  variants!: ProductVariantResponseDto[];

  @ApiPropertyOptional()
  primaryImage?: ProductImageResponseDto | null;

  @ApiPropertyOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  maxPrice?: number;

  @ApiProperty()
  variantCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data!: ProductResponseDto[];

  @ApiProperty({
    example: {
      total: 50,
      page: 1,
      limit: 10,
      totalPages: 5,
    },
  })
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class PaginatedVariantResponseDto {
  @ApiProperty({ type: [ProductVariantResponseDto] })
  data!: ProductVariantResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    },
  })
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
