import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Tanvir Hossain', description: 'Updated customer full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+8801711223344', description: 'Updated contact telephone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'NewSecurePass123!', description: 'Optional new password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Customer account active toggle' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'House 42, Road 11', description: 'Street address' })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional({ example: 'Dhaka', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Dhaka', description: 'State / Division' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '1212', description: 'Postal / ZIP code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;
}
