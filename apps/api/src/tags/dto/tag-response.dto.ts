import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Summer Collection' })
  name!: string;

  @ApiProperty({ example: 'summer-collection' })
  slug!: string;

  @ApiPropertyOptional({ example: '#0d6efd' })
  colorCode?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 12, description: 'Number of products linked with this tag' })
  productCount!: number;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-31T10:00:00.000Z' })
  updatedAt!: Date;
}

export class PublicTagDto {
  @ApiProperty({ example: 'd9b2b5e2-63a2-4a7b-a634-11e03a9364a1' })
  id!: string;

  @ApiProperty({ example: 'Summer Collection' })
  name!: string;

  @ApiProperty({ example: 'summer-collection' })
  slug!: string;

  @ApiPropertyOptional({ example: '#0d6efd' })
  colorCode?: string | null;

  @ApiProperty({ example: 12 })
  productCount!: number;
}

export class PaginatedTagResponseDto {
  @ApiProperty({ type: [TagResponseDto] })
  items!: TagResponseDto[];

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
