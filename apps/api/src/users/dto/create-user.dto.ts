import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'staff@az-ecommerce.local' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Sharif Mohammad Helal Uddin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: '+880172868595' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.ADMIN })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.ADMIN;

  @ApiPropertyOptional({ description: 'ID of assigned custom role definition' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ example: 'Human Resource Management' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Establishment Section' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ example: 'Dhaka (District) - District: Dhaka' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
