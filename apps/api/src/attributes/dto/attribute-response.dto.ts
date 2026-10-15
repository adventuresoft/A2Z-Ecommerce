import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '@prisma/client';
import { AttributeValueResponseDto } from './attribute-value.dto.js';

export class AttributeCountsDto {
  @ApiProperty({ example: 0, description: 'Number of products referencing this attribute' })
  products!: number;

  @ApiProperty({ example: 0, description: 'Number of variants referencing this attribute' })
  variants!: number;
}

export class AttributeResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Color' })
  name!: string;

  @ApiProperty({ example: 'color' })
  slug!: string;

  @ApiProperty({ enum: AttributeType, example: AttributeType.COLOR })
  type!: AttributeType;

  @ApiPropertyOptional({ example: 'Product color options with visual swatches.' })
  description?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ type: [AttributeValueResponseDto] })
  values!: AttributeValueResponseDto[];

  @ApiProperty({ type: AttributeCountsDto })
  counts!: AttributeCountsDto;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  updatedAt!: Date;
}

export class PublicAttributeValueDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Navy Blue' })
  value!: string;

  @ApiPropertyOptional({ example: 'Navy' })
  label?: string | null;

  @ApiPropertyOptional({ example: '#000080' })
  colorCode?: string | null;

  @ApiProperty({ example: 1 })
  sortOrder!: number;
}

export class PublicAttributeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Color' })
  name!: string;

  @ApiProperty({ example: 'color' })
  slug!: string;

  @ApiProperty({ enum: AttributeType, example: AttributeType.COLOR })
  type!: AttributeType;

  @ApiPropertyOptional({ example: 'Product color options' })
  description?: string | null;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ type: [PublicAttributeValueDto] })
  values!: PublicAttributeValueDto[];
}
