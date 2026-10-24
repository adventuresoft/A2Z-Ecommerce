import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxClassResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Standard Electronics VAT' })
  name!: string;

  @ApiProperty({ example: 'VAT-ELEC-5' })
  code!: string;

  @ApiProperty({ example: 5.0 })
  rate!: number;

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: 'Standard 5% VAT rate for consumer electronics' })
  description?: string | null;

  @ApiPropertyOptional({ example: 12, description: 'Number of categories linked to this tax class' })
  categoriesCount?: number;

  @ApiPropertyOptional({ example: 45, description: 'Number of products linked to this tax class' })
  productsCount?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedTaxClassResponseDto {
  @ApiProperty({ type: [TaxClassResponseDto] })
  items!: TaxClassResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}
