import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DivisionDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Dhaka' })
  name!: string;

  @ApiPropertyOptional({ example: 'ঢাকা' })
  bnName?: string | null;
}

export class DistrictDto {
  @ApiProperty({ example: 14 })
  id!: number;

  @ApiProperty({ example: 4 })
  divisionId!: number;

  @ApiProperty({ example: 'Dhaka' })
  name!: string;

  @ApiPropertyOptional({ example: 'ঢাকা' })
  bnName?: string | null;
}

export class ThanaDto {
  @ApiProperty({ example: 365 })
  id!: number;

  @ApiProperty({ example: 14 })
  districtId!: number;

  @ApiProperty({ example: 'Savar' })
  name!: string;

  @ApiPropertyOptional({ example: 'সাভার' })
  bnName?: string | null;
}

export class PostOfficeDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 365 })
  thanaId!: number;

  @ApiProperty({ example: 'Savar' })
  name!: string | null;

  @ApiPropertyOptional({ example: 'সাভার' })
  bnName?: string | null;

  @ApiPropertyOptional({ example: '1340' })
  postalCode?: string | null;
}

export class CityCorporationDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 14 })
  districtId!: number;

  @ApiProperty({ example: 'Dhaka North' })
  name!: string;

  @ApiPropertyOptional({ example: 'ঢাকা উত্তর' })
  bnName?: string | null;
}

export class PaurashavaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 14 })
  districtId!: number;

  @ApiProperty({ example: 'Savar' })
  name!: string;

  @ApiPropertyOptional({ example: 'সাভার' })
  bnName?: string | null;
}

export class UnionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 365 })
  thanaId!: number;

  @ApiProperty({ example: 'Amin Bazar' })
  name!: string;

  @ApiPropertyOptional({ example: 'আমিন বাজার' })
  bnName?: string | null;
}

export class WardDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  cityCorporationId!: number;

  @ApiProperty({ example: 1 })
  wardNo!: number;

  @ApiPropertyOptional({ example: 'Ward 1' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'ওয়ার্ড ১' })
  bnName?: string | null;
}

