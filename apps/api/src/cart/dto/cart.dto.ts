import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 0, description: 'New quantity (0 removes item)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class SyncCartItemInputDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class SyncCartDto {
  @ApiProperty({ type: [SyncCartItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemInputDto)
  items!: SyncCartItemInputDto[];
}

export class CartItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional({ nullable: true })
  variantLabel?: string | null;

  @ApiPropertyOptional({ nullable: true })
  imageUrl?: string | null;

  @ApiProperty({ example: 2500 })
  regularPrice!: number;

  @ApiPropertyOptional({ example: 2200, nullable: true })
  salePrice?: number | null;

  @ApiProperty({ example: 2200 })
  effectivePrice!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 4400 })
  lineTotal!: number;

  @ApiProperty({ example: 15 })
  availableQuantity!: number;

  @ApiProperty({ example: true })
  inStock!: boolean;

  @ApiProperty({ example: false })
  isUnavailable!: boolean;

  @ApiProperty()
  updatedAt!: Date;
}

export class CartWarningDto {
  @ApiProperty()
  variantId!: string;

  @ApiProperty({ enum: ['VARIANT_UNAVAILABLE', 'OUT_OF_STOCK', 'QUANTITY_CAPPED'] })
  code!: 'VARIANT_UNAVAILABLE' | 'OUT_OF_STOCK' | 'QUANTITY_CAPPED';

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional()
  requestedQuantity?: number;

  @ApiPropertyOptional()
  appliedQuantity?: number;
}

export class CartResponseDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];

  @ApiProperty({ example: 3 })
  totalItems!: number;

  @ApiProperty({ example: 6600 })
  subtotal!: number;

  @ApiPropertyOptional({ type: [CartWarningDto] })
  warnings?: CartWarningDto[];
}

export class CartClearResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 2 })
  removedCount!: number;
}
