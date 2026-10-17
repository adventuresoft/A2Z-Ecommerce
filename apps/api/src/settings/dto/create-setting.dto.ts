import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const ALLOWED_DATA_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const;
export type SettingDataType = (typeof ALLOWED_DATA_TYPES)[number];

export const ALLOWED_SETTING_GROUPS = [
  'GENERAL',
  'LOCALIZATION',
  'ORDER',
  'INVENTORY',
  'SHIPPING',
  'NOTIFICATION',
  'SECURITY',
] as const;
export type SettingGroup = (typeof ALLOWED_SETTING_GROUPS)[number];

export class CreateSettingDto {
  @ApiProperty({
    example: 'store_name',
    description: 'Unique setting identifier key (lowercase alphanumeric and underscores)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'key must contain only lowercase letters, numbers, and underscores',
  })
  key: string;

  @ApiProperty({ example: 'A2Z E-Commerce Store', description: 'Stored raw string value' })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    example: 'STRING',
    enum: ALLOWED_DATA_TYPES,
    default: 'STRING',
    description: 'Data type hint for parsing values',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DATA_TYPES)
  dataType?: SettingDataType;

  @ApiPropertyOptional({
    example: 'GENERAL',
    enum: ALLOWED_SETTING_GROUPS,
    default: 'GENERAL',
    description: 'Operational grouping category',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether this setting can be queried by unauthenticated storefront clients',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: 'Primary customer-facing store brand name',
    description: 'Helpful description for administrators',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
