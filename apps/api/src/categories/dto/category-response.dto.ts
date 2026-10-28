import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParentCategorySummaryDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Electronics' })
  name!: string;

  @ApiProperty({ example: 'electronics' })
  slug!: string;
}

export class CategoryCountsDto {
  @ApiProperty({ example: 3, description: 'Number of direct child subcategories' })
  subcategories!: number;

  @ApiProperty({ example: 0, description: 'Number of assigned products' })
  products!: number;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Laptops' })
  name!: string;

  @ApiProperty({ example: 'laptops' })
  slug!: string;

  @ApiPropertyOptional({ example: 'All portable computers' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/laptops.png' })
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  parentId?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false })
  showInBrowseCatalog!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: ParentCategorySummaryDto })
  parent?: ParentCategorySummaryDto | null;

  @ApiPropertyOptional({ type: CategoryCountsDto })
  counts?: CategoryCountsDto;
}

export class PaginatedCategoryResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  items!: CategoryResponseDto[];

  @ApiProperty({ example: 48 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

export class CategoryTreeNodeDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Electronics' })
  name!: string;

  @ApiProperty({ example: 'electronics' })
  slug!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/icon.png' })
  imageUrl?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiPropertyOptional({ example: false })
  showInBrowseCatalog?: boolean;

  @ApiPropertyOptional({ example: 45, description: 'Total active products including subcategories' })
  productsCount?: number;

  @ApiProperty({ type: [CategoryTreeNodeDto], description: 'Child subcategories' })
  children!: CategoryTreeNodeDto[];
}

export class BrowseCatalogCategoryDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Gaming Laptops' })
  name!: string;

  @ApiProperty({ example: 'gaming-laptops' })
  slug!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/icon.png' })
  imageUrl?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  parentId?: string | null;

  @ApiProperty({ example: true })
  showInBrowseCatalog!: boolean;

  @ApiPropertyOptional({ example: 45, description: 'Total active products including subcategories' })
  productsCount?: number;
}

