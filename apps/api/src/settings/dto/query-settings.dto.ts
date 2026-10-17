import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class QuerySettingsDto {
  @ApiPropertyOptional({
    example: 'GENERAL',
    description: 'Filter settings by operational group',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter settings by public storefront visibility',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isPublic?: boolean;
}
