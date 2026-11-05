import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Home Maintenance & Repair' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'গৃহ মেরামত ও রক্ষণাবেক্ষণ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;

  @ApiPropertyOptional({ example: 'home-repair' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Home Maintenance & Repair' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'গৃহ মেরামত ও রক্ষণাবেক্ষণ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;

  @ApiPropertyOptional({ example: 'home-repair' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProfessionDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ example: 'Electrician' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'ইলেকট্রিশিয়ান' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfessionDto {
  @ApiPropertyOptional({ example: 'a0000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Electrician' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'ইলেকট্রিশিয়ান' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateSkillDto {
  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  professionId!: string;

  @ApiProperty({ example: 'House Wiring' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'হাউস ওয়্যারিং' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;
}

export class SuggestSkillDto {
  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  professionId!: string;

  @ApiProperty({ example: 'Industrial Switchgear Wiring' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'ইন্ডাস্ট্রিয়াল সুইচগিয়ার ওয়্যারিং' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bnName?: string;
}

export class MergeSkillDto {
  @ApiProperty({
    example: 'c0000000-0000-0000-0000-000000000002',
    description: 'Target active canonical skill ID to merge into',
  })
  @IsUUID()
  @IsNotEmpty()
  targetSkillId!: string;
}

