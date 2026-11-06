import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MarketplaceSort {
  DEFAULT = 'default',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  EXPERIENCE = 'experience',
  TOP_RATED = 'top_rated',
}

export enum MarketplaceAddressType {
  CITY_CORPORATION = 'CITY_CORPORATION',
  PAURASHAVA = 'PAURASHAVA',
  UNION = 'UNION',
}

export class MarketplaceListQueryDto {
  @ApiPropertyOptional({ description: 'Profession category id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Profession id' })
  @IsOptional()
  @IsString()
  professionId?: string;

  @ApiPropertyOptional({ description: 'Comma separated skill ids (all must match)' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  skillIds?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum rating (1 to 5)' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  thanaId?: number;

  @ApiPropertyOptional({ enum: MarketplaceAddressType })
  @IsOptional()
  @IsEnum(MarketplaceAddressType)
  addressType?: MarketplaceAddressType;

  @ApiPropertyOptional({ description: 'Comma separated: AVAILABLE,BUSY,UNAVAILABLE' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  availability?: string;

  @ApiPropertyOptional({ description: 'Search over name and title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: MarketplaceSort, default: MarketplaceSort.DEFAULT })
  @IsOptional()
  @IsEnum(MarketplaceSort)
  sort?: MarketplaceSort;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Opaque cursor from the previous page' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cursor?: string;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

