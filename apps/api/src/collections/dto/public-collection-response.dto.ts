import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CollectionProductSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ nullable: true })
  discountPercent?: number | null;

  @ApiPropertyOptional()
  inStock?: boolean;
}

export class HomeCollectionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  bannerUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  badgeText?: string | null;

  @ApiProperty({ example: 'default' })
  designTemplate!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional({ nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endDate?: Date | null;

  @ApiProperty({ type: [CollectionProductSummaryDto] })
  products!: CollectionProductSummaryDto[];
}

export class CollectionTaxonomyRefDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class CollectionMetadataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  bannerUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  badgeText?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  showOnHomePage!: boolean;

  @ApiProperty()
  designTemplate!: string;

  @ApiPropertyOptional({ nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  seoTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  seoDescription?: string | null;

  @ApiProperty({ type: [CollectionTaxonomyRefDto] })
  categories!: CollectionTaxonomyRefDto[];

  @ApiProperty({ type: [CollectionTaxonomyRefDto] })
  tags!: CollectionTaxonomyRefDto[];
}

export class CollectionPaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class CollectionDetailResponseDto {
  @ApiProperty({ type: CollectionMetadataDto })
  collection!: CollectionMetadataDto;

  @ApiProperty({ type: [CollectionProductSummaryDto] })
  products!: CollectionProductSummaryDto[];

  @ApiProperty({ type: CollectionPaginationDto })
  pagination!: CollectionPaginationDto;
}
