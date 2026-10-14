import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Laptops & Computers', description: 'Display name of the category', maxLength: 100 })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    example: 'laptops-and-computers',
    description: 'Unique URL slug. Auto-generated from name if omitted',
    maxLength: 120,
  })
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @MaxLength(120, { message: 'Slug cannot exceed 120 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'All types of personal laptops, notebooks and desktops', description: 'Category description' })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/images/laptops.jpg', description: 'Header or icon image URL' })
  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Image URL cannot exceed 255 characters' })
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
    description: 'UUID of parent category (null if root level)',
  })
  @IsString({ message: 'Parent ID must be a string UUID' })
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Visibility toggle on storefront' })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 0, description: 'Ordering position in navigation menus' })
  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be greater than or equal to 0' })
  @IsOptional()
  sortOrder?: number;
}
