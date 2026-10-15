import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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

export class CreateAttributeValueDto {
  @ApiProperty({
    example: 'Navy Blue',
    description: 'Stored value or name of the attribute value',
    maxLength: 100,
  })
  @IsString({ message: 'Value must be a string' })
  @IsNotEmpty({ message: 'Value is required' })
  @MaxLength(100, { message: 'Value cannot exceed 100 characters' })
  value!: string;

  @ApiPropertyOptional({
    example: 'Navy',
    description: 'Human-readable display label',
    maxLength: 100,
  })
  @IsString({ message: 'Label must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Label cannot exceed 100 characters' })
  label?: string;

  @ApiPropertyOptional({
    example: '#000080',
    description: 'Optional hex color code (#RGB or #RRGGBB) for COLOR attribute swatches',
    maxLength: 20,
  })
  @IsString({ message: 'Color code must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Color code cannot exceed 20 characters' })
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'Color code must be a valid hex color code (e.g. #000 or #000080)',
  })
  colorCode?: string;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Display order among siblings',
  })
  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be greater than or equal to 0' })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Active status toggle',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}

export class CreateAttributeValueInlineDto extends CreateAttributeValueDto {}

export class UpdateAttributeValueDto extends PartialType(CreateAttributeValueDto) {}

export class AttributeValueResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  attributeId!: string;

  @ApiProperty({ example: 'Navy Blue' })
  value!: string;

  @ApiPropertyOptional({ example: 'Navy' })
  label?: string | null;

  @ApiPropertyOptional({ example: '#000080' })
  colorCode?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  updatedAt!: Date;
}
