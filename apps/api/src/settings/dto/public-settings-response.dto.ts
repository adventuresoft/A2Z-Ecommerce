import { ApiPropertyOptional } from '@nestjs/swagger';
import { HeroBannerItemDto } from './hero-banner.dto.js';

export class PublicSettingsResponseDto {
  @ApiPropertyOptional({ example: 'A to Z Ecommerce' })
  store_name?: string;

  @ApiPropertyOptional({ example: 'BDT' })
  default_currency?: string;

  @ApiPropertyOptional({ example: 'BDT' })
  currency_symbol?: string;

  @ApiPropertyOptional({ example: true })
  enable_cod?: boolean;

  @ApiPropertyOptional({ example: '1.0.0', name: 'mobile.min_supported_version' })
  'mobile.min_supported_version'?: string;

  @ApiPropertyOptional({ example: '1.0.0', name: 'mobile.latest_version' })
  'mobile.latest_version'?: string;

  @ApiPropertyOptional({ type: [HeroBannerItemDto] })
  heroBanners?: HeroBannerItemDto[];

  [key: string]: unknown;
}
