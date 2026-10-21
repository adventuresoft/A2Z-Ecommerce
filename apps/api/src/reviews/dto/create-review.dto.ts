import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Target Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    description: 'Optional verified purchase Order ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({
    description: 'Rating stars from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review headline',
    example: 'Exceptional quality and fast delivery!',
    maxLength: 150,
  })
  @IsString()
  @MaxLength(150)
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Detailed review body / feedback',
    example: 'The fabric feels very premium and the color matches the pictures exactly.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
