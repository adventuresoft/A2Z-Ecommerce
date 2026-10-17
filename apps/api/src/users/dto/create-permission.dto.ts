import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'user.read' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({ example: 'Read Users' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'users' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ example: 'read' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'Permission to view and search user accounts' })
  @IsOptional()
  @IsString()
  description?: string;
}
