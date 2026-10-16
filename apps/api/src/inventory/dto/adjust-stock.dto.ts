import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, NotEquals } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Product variant UUID to adjust stock for',
    example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Adjustment classification type',
    enum: [
      StockMovementType.RESTOCK,
      StockMovementType.MANUAL_ADJUSTMENT,
      StockMovementType.DAMAGED,
    ],
    example: StockMovementType.RESTOCK,
  })
  @IsEnum([
    StockMovementType.RESTOCK,
    StockMovementType.MANUAL_ADJUSTMENT,
    StockMovementType.DAMAGED,
  ])
  @IsNotEmpty()
  type: StockMovementType;

  @ApiProperty({
    description: 'Delta quantity to apply. Positive for restocking/found stock, negative for write-offs/shrinkage.',
    example: 50,
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0, { message: 'quantityChange cannot be zero' })
  quantityChange: number;

  @ApiPropertyOptional({
    description: 'External reference number such as Purchase Order # or Audit Batch code',
    example: 'PO-2026-1001',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Administrative notes or justification for the adjustment',
    example: 'Received 50 units from manufacturer batch #49A',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
