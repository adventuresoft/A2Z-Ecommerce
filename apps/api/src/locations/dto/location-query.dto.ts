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

