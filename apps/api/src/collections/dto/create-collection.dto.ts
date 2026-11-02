import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Flash Sale Deals', description: 'Name of the collection', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'flash-sale',
    description: 'Unique URL slug (auto-generated if omitted)',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Unbeatable discounts on top electronics for a limited time', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/images/flash-sale-banner.jpg', description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'Limited Time Offer', description: 'Badge or pill label' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  badgeText?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the collection is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00Z', description: 'Campaign start time' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-10T23:59:59Z', description: 'Campaign end time for countdown timer' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Best Flash Sale Electronics Bangladesh', description: 'SEO Meta Title' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Huge savings on top brands during our official flash sale.', description: 'SEO Meta Description' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  seoDescription?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display priority/sort order' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'], description: 'Category IDs to include products from' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ example: ['uuid-tag-1'], description: 'Tag IDs to filter products by' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ example: ['uuid-prod-1', 'uuid-prod-2'], description: 'Product IDs to explicitly include/pin' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}

