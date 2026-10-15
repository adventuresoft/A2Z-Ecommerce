import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Samsung',
    description: 'Display name of the brand',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    example: 'samsung',
    description: 'Unique URL slug. Auto-generated from name if omitted',
    maxLength: 120,
  })
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @MaxLength(120, { message: 'Slug cannot exceed 120 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be lowercase alphanumeric characters separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Global leader in mobile electronics and consumer tech.',
    description: 'Optional brand description',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '/uploads/brands/brand_123.png',
    description: 'Brand logo image URL or relative path',
    maxLength: 255,
  })
  @IsString({ message: 'Logo URL must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Logo URL cannot exceed 255 characters' })
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://www.samsung.com',
    description: 'Official manufacturer website URL (http or https)',
    maxLength: 255,
  })
  @IsString({ message: 'Website must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Website URL cannot exceed 255 characters' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Website must be a valid http or https URL' },
  )
  website?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Visibility toggle on storefront and public endpoints',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Ordering position for curated listings',
  })
  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be greater than or equal to 0' })
  @IsOptional()
  sortOrder?: number;
}
