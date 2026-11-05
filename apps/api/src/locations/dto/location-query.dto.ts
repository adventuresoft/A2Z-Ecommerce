import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class DistrictQueryDto {
  @ApiPropertyOptional({ example: 4, description: 'Division ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;
}

export class ThanaQueryDto {
  @ApiPropertyOptional({ example: 14, description: 'District ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;
}

export class PostOfficeQueryDto {
  @ApiPropertyOptional({ example: 365, description: 'Thana ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  thanaId?: number;
}

export class CityCorporationQueryDto {
  @ApiPropertyOptional({ example: 14, description: 'District ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;
}

export class PaurashavaQueryDto {
  @ApiPropertyOptional({ example: 14, description: 'District ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;
}

export class UnionQueryDto {
  @ApiPropertyOptional({ example: 365, description: 'Thana ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  thanaId?: number;
}

export class WardQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'City Corporation ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cityCorporationId?: number;
}

