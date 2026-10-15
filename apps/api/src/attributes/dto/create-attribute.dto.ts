import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateAttributeValueInlineDto } from './attribute-value.dto.js';

export class CreateAttributeDto {
  @ApiProperty({
    example: 'Color',
    description: 'Display name of the attribute',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @ApiPropertyOptional({
    example: 'color',
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
    example: AttributeType.TEXT,
    enum: AttributeType,
    default: AttributeType.TEXT,
    description: 'Presentation type: TEXT, COLOR (with swatches), or BUTTON',
  })
  @IsEnum(AttributeType, {
    message: 'Type must be one of: TEXT, COLOR, BUTTON',
  })
  @IsOptional()
  type?: AttributeType = AttributeType.TEXT;

  @ApiPropertyOptional({
    example: 'Visual color options for apparel and accessories',
    description: 'Optional description of the attribute',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Active status toggle',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Ordering position for catalog listings',
  })
  @IsInt({ message: 'Sort order must be an integer' })
  @Min(0, { message: 'Sort order must be greater than or equal to 0' })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [CreateAttributeValueInlineDto],
    description: 'Optional initial list of attribute values to create atomically',
  })
  @IsArray({ message: 'Values must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueInlineDto)
  @IsOptional()
  values?: CreateAttributeValueInlineDto[];
}
