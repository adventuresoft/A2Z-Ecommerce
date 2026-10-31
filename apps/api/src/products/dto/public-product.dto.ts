import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class PublicProductQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Search term keyword' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug' })
  @IsString()
  @IsOptional()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Filter by brand UUID' })
  @IsUUID('4')
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by brand slug' })
  @IsString()
  @IsOptional()
  brandSlug?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag slug or comma-separated tag slugs',
    example: 'summer-collection,trending',
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: 'Filter by single tag slug' })
  @IsString()
  @IsOptional()
  tagSlug?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter', example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by inventory in-stock availability' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Filter products with active sale discount' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasDiscount?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by attribute value slugs/names, comma-separated or repeatable',
    example: 'red,green,xl',
  })
  @IsString()
  @IsOptional()
  attributeValues?: string;

  @ApiPropertyOptional({
    description: 'Catalog sort ordering',
    enum: ['newest', 'price_asc', 'price_desc', 'rating', 'featured'],
    default: 'newest',
  })
  @IsString()
  @IsIn(['newest', 'price_asc', 'price_desc', 'rating', 'featured'])
  @IsOptional()
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'featured' = 'newest';
}

export class PublicProductCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class PublicProductBrandDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  logoUrl?: string | null;
}

export class PublicProductTagDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  colorCode?: string | null;
}

export class PublicProductImageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  imageUrl!: string;

  @ApiPropertyOptional()
  altText?: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

export class PublicProductSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  shortDescription?: string | null;

  @ApiProperty({ type: PublicProductCategoryDto })
  category!: PublicProductCategoryDto;

  @ApiPropertyOptional({ type: PublicProductBrandDto })
  brand?: PublicProductBrandDto | null;

  @ApiPropertyOptional({ type: PublicProductImageDto })
  primaryImage?: PublicProductImageDto | null;

  @ApiProperty()
  regularPrice!: number;

  @ApiPropertyOptional()
  salePrice?: number | null;

  @ApiProperty()
  minPrice!: number;

  @ApiProperty()
  maxPrice!: number;

  @ApiPropertyOptional()
  discountPercent?: number | null;

  @ApiProperty()
  inStock!: boolean;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty({ type: [PublicProductTagDto] })
  tags!: PublicProductTagDto[];

  @ApiProperty()
  createdAt!: Date;
}

export class FacetAttributeValueDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiPropertyOptional()
  colorCode?: string | null;

  @ApiPropertyOptional()
  count?: number;
}

export class FacetAttributeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['TEXT', 'COLOR', 'BUTTON'] })
  type!: string;

  @ApiProperty({ type: [FacetAttributeValueDto] })
  values!: FacetAttributeValueDto[];
}

export class PublicProductFacetsDto {
  @ApiPropertyOptional({ type: [FacetAttributeDto] })
  attributes?: FacetAttributeDto[];
}

export class PaginatedPublicProductResponseDto {
  @ApiProperty({ type: [PublicProductSummaryDto] })
  items!: PublicProductSummaryDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiPropertyOptional({ type: PublicProductFacetsDto })
  facets?: PublicProductFacetsDto;
}

export class PublicVariantAttributeDto {
  @ApiProperty()
  attributeName!: string;

  @ApiProperty()
  attributeSlug!: string;

  @ApiProperty()
  attributeType!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiPropertyOptional()
  colorCode?: string | null;
}

export class PublicProductVariantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional()
  barcode?: string | null;

  @ApiProperty()
  regularPrice!: number;

  @ApiPropertyOptional()
  salePrice?: number | null;

  @ApiPropertyOptional()
  discountPercent?: number | null;

  @ApiPropertyOptional()
  weightGrams?: number | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiProperty()
  inStock!: boolean;

  @ApiProperty()
  stockQuantity!: number;

  @ApiProperty({ type: [PublicVariantAttributeDto] })
  attributes!: PublicVariantAttributeDto[];
}

export class PublicProductReviewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rating!: number;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiProperty()
  comment!: string;

  @ApiProperty()
  reviewerName!: string;

  @ApiProperty()
  isVerifiedPurchase!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class PublicProductDetailDto {
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

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty({ type: PublicProductCategoryDto })
  category!: PublicProductCategoryDto;

  @ApiPropertyOptional({ type: PublicProductBrandDto })
  brand?: PublicProductBrandDto | null;

  @ApiProperty({ type: [PublicProductImageDto] })
  images!: PublicProductImageDto[];

  @ApiProperty({ type: [PublicProductVariantDto] })
  variants!: PublicProductVariantDto[];

  @ApiProperty({ type: [PublicProductTagDto] })
  tags!: PublicProductTagDto[];

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty({ type: [PublicProductReviewDto] })
  reviews!: PublicProductReviewDto[];

  @ApiProperty({ type: [PublicProductSummaryDto] })
  relatedProducts!: PublicProductSummaryDto[];

  @ApiPropertyOptional()
  warrantyText?: string | null;

  @ApiPropertyOptional()
  specifications?: any;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ProductSearchSuggestionItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  price!: number;

  @ApiPropertyOptional()
  image?: string | null;

  @ApiProperty()
  category!: string;
}

export class CategorySearchSuggestionItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class SearchSuggestionsDto {
  @ApiProperty({ type: [ProductSearchSuggestionItemDto] })
  products!: ProductSearchSuggestionItemDto[];

  @ApiProperty({ type: [CategorySearchSuggestionItemDto] })
  categories!: CategorySearchSuggestionItemDto[];
}

export class CuratedProductsDto {
  @ApiProperty({ type: [PublicProductSummaryDto] })
  flashDeals!: PublicProductSummaryDto[];

  @ApiProperty({ type: [PublicProductSummaryDto] })
  featured!: PublicProductSummaryDto[];

  @ApiProperty({ type: [PublicProductSummaryDto] })
  newArrivals!: PublicProductSummaryDto[];

  @ApiProperty({ type: [PublicProductSummaryDto] })
  bestSellers!: PublicProductSummaryDto[];
}

