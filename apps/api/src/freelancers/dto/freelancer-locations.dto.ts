import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LocationItemDto {
  @ApiPropertyOptional({ example: 'a984f47e-8c3b-410a-8bf8-d65eef83151b' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  divisionId!: number;

  @ApiProperty({ example: 47 })
  @Type(() => Number)
  @IsInt()
  districtId!: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt()
  thanaId!: number;

  @ApiProperty({ example: 340 })
  @Type(() => Number)
  @IsInt()
  postOfficeId!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cityCorporationId?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  wardId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  paurashavaId?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  unionId?: number;

  @ApiPropertyOptional({ example: 'Sector 4, Uttara' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  localityText?: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  isPrimary!: boolean;
}

export class ManageLocationsDto {
  @ApiProperty({ type: [LocationItemDto], description: 'Between 1 and 5 locations' })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 location is required' })
  @ArrayMaxSize(5, { message: 'A maximum of 5 locations can be configured' })
  @ValidateNested({ each: true })
  @Type(() => LocationItemDto)
  locations!: LocationItemDto[];
}

