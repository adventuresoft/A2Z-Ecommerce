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

