import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillStatus } from '@prisma/client';

export class ProfessionCategoryDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Home Maintenance & Repair' })
  name!: string;

  @ApiPropertyOptional({ example: 'গৃহ মেরামত ও রক্ষণাবেক্ষণ' })
  bnName?: string | null;

  @ApiPropertyOptional({ example: 'home-repair' })
  icon?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 1 })
  sortOrder!: number;
}

export class ProfessionDto {
  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  categoryId!: string;

  @ApiProperty({ example: 'Electrician' })
  name!: string;

  @ApiPropertyOptional({ example: 'ইলেকট্রিশিয়ান' })
  bnName?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiPropertyOptional({ type: ProfessionCategoryDto })
  category?: ProfessionCategoryDto;
}

export class SkillDto {
  @ApiProperty({ example: 'c0000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000001' })
  professionId!: string;

  @ApiProperty({ example: 'House Wiring' })
  name!: string;

  @ApiPropertyOptional({ example: 'হাউস ওয়্যারিং' })
  bnName?: string | null;

  @ApiProperty({ enum: SkillStatus, example: SkillStatus.ACTIVE })
  status!: SkillStatus;

  @ApiPropertyOptional({ example: 'u0000000-0000-0000-0000-000000000001' })
  suggestedById?: string | null;

  @ApiPropertyOptional({ example: 'c0000000-0000-0000-0000-000000000002' })
  mergedIntoId?: string | null;

  @ApiPropertyOptional({ example: '2026-11-05T10:00:00.000Z' })
  createdAt?: Date;
}

