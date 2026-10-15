import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProductImageDto {
  @ApiPropertyOptional({
    example: 'Front view of blue sneakers',
    description: 'Image alt text for accessibility and SEO',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  altText?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Set as the primary cover thumbnail for the product',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order rank in product gallery',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class ReorderProductImagesDto {
  @ApiProperty({
    example: ['image-uuid-1', 'image-uuid-2'],
    description: 'Ordered array of image UUIDs for the product gallery',
  })
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each image ID must be a valid UUID' })
  imageIds!: string[];
}
