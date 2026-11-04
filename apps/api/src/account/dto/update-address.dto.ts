import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Work', description: 'Address label' })
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @MaxLength(50, { message: 'Label cannot exceed 50 characters' })
  label?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Recipient name' })
  @IsOptional()
  @IsString({ message: 'Recipient name must be a string' })
  @MaxLength(150, { message: 'Recipient name cannot exceed 150 characters' })
  recipientName?: string;

  @ApiPropertyOptional({ example: '+8801700000000', description: 'Contact phone' })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(30, { message: 'Phone cannot exceed 30 characters' })
  phone?: string;

  @ApiPropertyOptional({ example: 'House 12, Road 4, Sector 3', description: 'Street address' })
  @IsOptional()
  @IsString({ message: 'Street address must be a string' })
  @MaxLength(255, { message: 'Street address cannot exceed 255 characters' })
  streetAddress?: string;

  @ApiPropertyOptional({ example: 'Dhaka', description: 'City / District name' })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city?: string;

  @ApiPropertyOptional({ example: 'Dhaka', description: 'State / Division name' })
  @IsOptional()
  @IsString({ message: 'State must be a string' })
  @MaxLength(100, { message: 'State cannot exceed 100 characters' })
  state?: string;

  @ApiPropertyOptional({ example: 'Savar', description: 'Thana / Upazila name' })
  @IsOptional()
  @IsString({ message: 'Thana must be a string' })
  @MaxLength(100, { message: 'Thana cannot exceed 100 characters' })
  thana?: string;

  @ApiPropertyOptional({ example: 4, description: 'Division ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'divisionId must be an integer' })
  divisionId?: number;

  @ApiPropertyOptional({ example: 14, description: 'District ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'districtId must be an integer' })
  districtId?: number;

  @ApiPropertyOptional({ example: 365, description: 'Thana ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'thanaId must be an integer' })
  thanaId?: number;

  @ApiPropertyOptional({ example: '1230', description: 'Postal code' })
  @IsOptional()
  @IsString({ message: 'Postal code must be a string' })
  @MaxLength(20, { message: 'Postal code cannot exceed 20 characters' })
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', description: 'Country' })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(100, { message: 'Country cannot exceed 100 characters' })
  country?: string;

  @ApiPropertyOptional({ example: true, description: 'Designate as default shipping address' })
  @IsOptional()
  @IsBoolean({ message: 'isDefaultShipping must be a boolean' })
  isDefaultShipping?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Designate as default billing address' })
  @IsOptional()
  @IsBoolean({ message: 'isDefaultBilling must be a boolean' })
  isDefaultBilling?: boolean;
}
