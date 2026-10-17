import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Finance Administrator' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'finance_administrator' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Access to financial setups and basic configurations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], example: ['orders.read', 'payments.read', 'reports.read'] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
