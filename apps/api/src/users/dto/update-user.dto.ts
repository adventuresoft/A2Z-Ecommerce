import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Sharif Mohammad Helal Uddin' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+880172868595' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'ID of assigned role definition' })
  @IsOptional()
  @IsString()
  roleId?: string | null;

  @ApiPropertyOptional({ example: 'Human Resource Management' })
  @IsOptional()
  @IsString()
  department?: string | null;

  @ApiPropertyOptional({ example: 'Establishment Section' })
  @IsOptional()
  @IsString()
  section?: string | null;

  @ApiPropertyOptional({ example: 'Dhaka (District) - District: Dhaka' })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
