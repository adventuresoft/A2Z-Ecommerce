import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ProfessionQueryDto {
  @ApiPropertyOptional({ example: 'a0000000-0000-0000-0000-000000000001', description: 'Category ID filter' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class SkillQueryDto {
  @ApiPropertyOptional({ example: 'b0000000-0000-0000-0000-000000000001', description: 'Profession ID filter' })
  @IsOptional()
  @IsUUID()
  professionId?: string;
}

export class SuggestionQueryDto {
  @ApiPropertyOptional({ example: 'b0000000-0000-0000-0000-000000000001', description: 'Profession ID filter' })
  @IsOptional()
  @IsUUID()
  professionId?: string;
}

