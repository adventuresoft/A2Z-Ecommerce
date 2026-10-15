import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandCountsDto {
  @ApiProperty({
    example: 0,
    description: 'Number of assigned products (0 until Products module)',
  })
  products!: number;
}

export class BrandResponseDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Samsung' })
  name!: string;

  @ApiProperty({ example: 'samsung' })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Global leader in mobile electronics and consumer tech.',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: '/uploads/brands/brand_123.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://www.samsung.com' })
  website?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: BrandCountsDto })
  counts!: BrandCountsDto;
}

export class PublicBrandDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Samsung' })
  name!: string;

  @ApiProperty({ example: 'samsung' })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Global leader in mobile electronics and consumer tech.',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: '/uploads/brands/brand_123.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://www.samsung.com' })
  website?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class PaginatedBrandResponseDto {
  @ApiProperty({ type: [BrandResponseDto] })
  items!: BrandResponseDto[];

  @ApiProperty({ example: 7 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}
