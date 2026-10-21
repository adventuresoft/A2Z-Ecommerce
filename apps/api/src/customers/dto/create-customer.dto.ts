import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Tanvir Hossain', description: 'Full customer name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'tanvir.hossain@example.com',
    description: 'Unique customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Account login password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+8801711223344', description: 'Contact telephone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ default: true, description: 'Customer account active flag' })
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
