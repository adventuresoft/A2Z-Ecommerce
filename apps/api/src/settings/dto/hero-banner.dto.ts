import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class HeroBannerItemDto {
  @ApiProperty({ description: 'Unique identifier for the banner slide', example: 'slide-1' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'Primary headline banner title', example: 'MacBook Pro 16 M3 Max' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Subheading or promotional tagline', example: 'Supercharged for pros with next-gen Apple silicon' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: 'Banner background/hero image URL (Web & default)', example: '/uploads/banners/hero-macbook.webp' })
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiPropertyOptional({ description: 'Optional mobile-optimized hero banner image URL', example: '/uploads/banners/hero-macbook-mobile.webp' })
  @IsString()
  @IsOptional()
  mobileImageUrl?: string;

  @ApiPropertyOptional({ description: 'Primary call-to-action button label', example: 'Explore Now' })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiPropertyOptional({ description: 'Target URL when banner is clicked', example: '/products/apple-macbook-pro-16-m3-max' })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Badge pill text', example: 'EXCLUSIVE LAUNCH' })
  @IsString()
  @IsOptional()
  badgeText?: string;

  @ApiProperty({ description: 'Display order priority', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number = 0;

  @ApiProperty({ description: 'Whether the banner slide is active', default: true })
  @IsBoolean()
  isActive: boolean = true;
}

export class HeroBannersSettingDto {
  @ApiProperty({ type: [HeroBannerItemDto] })
  banners!: HeroBannerItemDto[];
}
