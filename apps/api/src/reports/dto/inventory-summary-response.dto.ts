import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryResponseDto {
  @ApiProperty({ description: 'Total number of tracked variant SKUs', example: 120 })
  totalSkus: number;

  @ApiProperty({ description: 'Total number of distinct parent products', example: 45 })
  totalProducts: number;

  @ApiProperty({ description: 'Total physical stock units across warehouse', example: 3450 })
  totalPhysicalUnits: number;

  @ApiProperty({ description: 'Total units reserved for pending customer checkouts', example: 85 })
  totalReservedUnits: number;

  @ApiProperty({ description: 'Total available units ready for immediate sale', example: 3365 })
  totalAvailableUnits: number;

  @ApiProperty({
    description: 'Inventory asset valuation based on regular list price',
    example: 4500000,
  })
  totalValuationRegular: number;

  @ApiProperty({
    description: 'Inventory valuation based on effective selling prices (sale price when active)',
    example: 4200000,
  })
  totalValuationSelling: number;

  @ApiProperty({
    description: 'Potential revenue from all currently available units at current selling prices',
    example: 4100000,
  })
  potentialRevenue: number;

  @ApiProperty({ description: 'Number of variants with healthy stock levels', example: 98 })
  inStockCount: number;

  @ApiProperty({ description: 'Percentage of variants with healthy stock levels', example: 81.67 })
  inStockPercentage: number;

  @ApiProperty({ description: 'Number of variants at or below low stock threshold', example: 14 })
  lowStockCount: number;

  @ApiProperty({ description: 'Percentage of variants in low stock condition', example: 11.67 })
  lowStockPercentage: number;

  @ApiProperty({ description: 'Number of variants completely depleted (0 or negative)', example: 8 })
  outOfStockCount: number;

  @ApiProperty({ description: 'Percentage of variants out of stock', example: 6.67 })
  outOfStockPercentage: number;

  @ApiProperty({ description: 'Average valuation per on-hand unit', example: 1217.39 })
  averageUnitValue: number;

  @ApiProperty({ description: 'Store operating currency', example: 'BDT' })
  currency: string;
}
