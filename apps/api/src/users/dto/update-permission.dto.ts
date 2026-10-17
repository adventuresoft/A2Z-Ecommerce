import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'Read Users' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Permission to view and search user accounts' })
  @IsOptional()
  @IsString()
  description?: string;
}
