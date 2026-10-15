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
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({
    example: 'TSH-BLK-XL',
    description: 'Unique Stock Keeping Unit (SKU) code',
    maxLength: 100,
  })
  @IsString({ message: 'SKU must be a string' })
  @IsNotEmpty({ message: 'SKU is required' })
  @MaxLength(100, { message: 'SKU cannot exceed 100 characters' })
  sku!: string;

  @ApiPropertyOptional({
    example: '8901234567890',
    description: 'UPC, EAN, or barcode',
    maxLength: 100,
  })
  @IsString({ message: 'Barcode must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Barcode cannot exceed 100 characters' })
  barcode?: string;

  @ApiProperty({
    example: 29.99,
    description: 'Regular standard selling price',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Regular price must be a valid number' })
  @Min(0.01, { message: 'Regular price must be greater than 0' })
  regularPrice!: number;

  @ApiPropertyOptional({
    example: 24.99,
    description: 'Discounted promotional sale price',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Sale price must be a valid number' })
  @IsOptional()
  @Min(0.01, { message: 'Sale price must be greater than 0' })
  salePrice?: number;

  @ApiPropertyOptional({
    example: 250,
    description: 'Physical weight in grams for shipping calculations',
  })
  @Type(() => Number)
  @IsInt({ message: 'Weight must be an integer' })
  @IsOptional()
  @Min(0, { message: 'Weight cannot be negative' })
  weightGrams?: number;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Optional ProductImage ID from the same parent product (Option B)',
  })
  @IsUUID('4', { message: 'Image ID must be a valid UUID' })
  @IsOptional()
  imageId?: string;

  @ApiPropertyOptional({
    example: '/uploads/products/variant-photo.jpg',
    description: 'Optional direct variant photo URL',
    maxLength: 255,
  })
  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  @MaxLength(255)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'SKU active availability toggle',
    default: true,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'],
    description: 'List of AttributeValue IDs associated with this variant (e.g. Color, Size)',
  })
  @IsArray({ message: 'attributeValueIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each attribute value ID must be a valid UUID' })
  @IsOptional()
  attributeValueIds?: string[];
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({
    example: 'TSH-BLK-XL',
    description: 'Unique Stock Keeping Unit (SKU) code',
    maxLength: 100,
  })
  @IsString({ message: 'SKU must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'SKU cannot exceed 100 characters' })
  sku?: string;

  @ApiPropertyOptional({
    example: '8901234567890',
    description: 'UPC, EAN, or barcode',
    maxLength: 100,
  })
  @IsString({ message: 'Barcode must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Barcode cannot exceed 100 characters' })
  barcode?: string;

  @ApiPropertyOptional({
    example: 29.99,
    description: 'Regular standard selling price',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Regular price must be a valid number' })
  @IsOptional()
  @Min(0.01, { message: 'Regular price must be greater than 0' })
  regularPrice?: number;

  @ApiPropertyOptional({
    example: 24.99,
    description: 'Discounted promotional sale price',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Sale price must be a valid number' })
  @IsOptional()
  @Min(0.01, { message: 'Sale price must be greater than 0' })
  salePrice?: number;

  @ApiPropertyOptional({
    example: 250,
    description: 'Physical weight in grams for shipping calculations',
  })
  @Type(() => Number)
  @IsInt({ message: 'Weight must be an integer' })
  @IsOptional()
  @Min(0, { message: 'Weight cannot be negative' })
  weightGrams?: number;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Optional ProductImage ID from the same parent product',
  })
  @IsUUID('4', { message: 'Image ID must be a valid UUID' })
  @IsOptional()
  imageId?: string | null;

  @ApiPropertyOptional({
    example: '/uploads/products/variant-photo.jpg',
    description: 'Optional direct variant photo URL',
    maxLength: 255,
  })
  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  @MaxLength(255)
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'SKU active availability toggle',
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    description: 'List of AttributeValue IDs associated with this variant',
  })
  @IsArray({ message: 'attributeValueIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each attribute value ID must be a valid UUID' })
  @IsOptional()
  attributeValueIds?: string[];
}

export class VariantQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search by SKU, barcode, or product title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by parent product ID' })
  @IsUUID('4')
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
