import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ALLOWED_DATA_TYPES, type SettingDataType } from './create-setting.dto.js';

export class UpdateSettingDto {
  @ApiPropertyOptional({ example: 'Updated Store Name', description: 'Updated raw string value' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    example: 'STRING',
    enum: ALLOWED_DATA_TYPES,
    description: 'Data type hint for parsing values',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DATA_TYPES)
  dataType?: SettingDataType;

  @ApiPropertyOptional({
    example: 'GENERAL',
    description: 'Operational grouping category',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this setting can be queried by unauthenticated storefront clients',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: 'Updated description for setting',
    description: 'Helpful description for administrators',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
