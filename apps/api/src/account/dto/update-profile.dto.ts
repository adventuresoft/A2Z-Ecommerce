import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Display name' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({ example: '+8801700000000', description: 'Contact phone number' })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(30, { message: 'Phone cannot exceed 30 characters' })
  phone?: string;
}
