import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaxClassDto {
  @ApiProperty({
    example: 'Standard Electronics VAT',
    description: 'Human-readable tax class title',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'VAT-ELEC-5',
    description: 'Unique alphanumeric identifier code for this tax class',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    example: 5.0,
    description: 'Statutory VAT/tax percentage rate (0 to 100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate!: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this tax class serves as the default fallback for unassigned items',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this tax class is active and selectable',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'Standard 5% VAT rate for consumer electronics, laptops, and IT hardware.',
    description: 'Detailed description or regulatory reference',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
