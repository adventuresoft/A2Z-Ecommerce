import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SettingItemUpdateDto {
  @ApiProperty({ example: 'store_name', description: 'Setting key to update' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'New Store Name', description: 'Updated raw string value' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: true, description: 'Optional visibility toggle update' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BatchUpdateSettingsDto {
  @ApiProperty({
    type: [SettingItemUpdateDto],
    description: 'Array of setting key-value modifications',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemUpdateDto)
  settings: SettingItemUpdateDto[];
}
