import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'Summer Collection',
    description: 'Display name of the tag',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    example: 'summer-collection',
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

  @ApiPropertyOptional({
    example: '#0d6efd',
    description: 'Optional hex color for UI badges (e.g. #0d6efd)',
    maxLength: 20,
  })
  @IsString({ message: 'colorCode must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'colorCode cannot exceed 20 characters' })
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'colorCode must be a valid hex color code (e.g. #0d6efd or #fff)',
  })
  colorCode?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Visibility toggle on storefront and public endpoints',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
