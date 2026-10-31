import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProductVariantDto } from './variant.dto.js';

export class CreateProductDto {
  @ApiProperty({
    example: 'Men Classic Cotton Crewneck T-Shirt',
    description: 'Marketing title of the product',
    maxLength: 255,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @ApiPropertyOptional({
    example: 'men-classic-cotton-crewneck-t-shirt',
    description: 'Unique URL slug. Auto-derived from title if omitted',
    maxLength: 255,
  })
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Slug cannot exceed 255 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiProperty({
    example: 'Crafted from 100% premium combed organic cotton for everyday comfort.',
    description: 'Full rich description of the product',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @ApiPropertyOptional({
    example: '100% combed organic cotton everyday crewneck.',
    description: 'Short teaser description for catalog cards',
    maxLength: 500,
  })
  @IsString({ message: 'Short description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Short description cannot exceed 500 characters' })
  shortDescription?: string;

  @ApiProperty({
    example: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Mandatory Category UUID',
  })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId!: string;

  @ApiPropertyOptional({
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'Optional Brand UUID',
  })
  @IsUUID('4', { message: 'Brand ID must be a valid UUID' })
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({
    example: '/uploads/products/product-cover.jpg',
    description: 'Single main/thumbnail image URL for the product',
    maxLength: 255,
  })
  @IsString({ message: 'Thumbnail URL must be a string' })
  @IsOptional()
  @MaxLength(255)
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    example: 'Official BTRC / Warranty',
    description: 'Warranty or badge label shown on product page',
    maxLength: 150,
  })
  @IsString({ message: 'warrantyText must be a string' })
  @IsOptional()
  @MaxLength(150)
  warrantyText?: string;

  @ApiPropertyOptional({
    example: [{ key: 'Brand', value: 'Apple' }, { key: 'Model', value: 'iPhone 15' }],
    description: 'Dynamic key-value specification attributes',
  })
  @IsOptional()
  specifications?: any;

  @ApiPropertyOptional({
    example: false,
    description: 'Featured product flag for homepage promotion',
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isFeatured must be a boolean' })
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Catalog visibility toggle',
    default: true,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['d9b2b5e2-63a2-4a7b-a634-11e03a9364a1'],
    description: 'Array of existing Tag UUIDs to link to the product',
    type: [String],
  })
  @IsArray({ message: 'tagIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({
    example: ['Summer Collection', 'Trending'],
    description: 'Array of tag names to link (creates on-the-fly if non-existent)',
    type: [String],
  })
  @IsArray({ message: 'tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    type: () => [CreateProductVariantDto],
    description: 'Initial variants list for multi-variant products',
  })
  @IsArray({ message: 'Variants must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];

  // Convenience fields for simple products when variants array is omitted:
  @ApiPropertyOptional({
    example: 'TSH-SIMPLE-001',
    description: 'Simple product fallback SKU (used when variants array is empty)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    example: 29.99,
    description: 'Simple product regular price (used when variants array is empty)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  regularPrice?: number;

  @ApiPropertyOptional({
    example: 24.99,
    description: 'Simple product sale price (used when variants array is empty)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  salePrice?: number;

  @ApiPropertyOptional({
    example: 250,
    description: 'Simple product weight in grams',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  weightGrams?: number;
}
