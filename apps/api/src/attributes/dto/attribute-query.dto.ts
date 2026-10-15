import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttributeType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AttributeQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'color',
    description: 'Search term matching attribute name or slug (case-insensitive)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: AttributeType.TEXT,
    enum: AttributeType,
    description: 'Filter by attribute type (TEXT, COLOR, BUTTON)',
  })
  @IsEnum(AttributeType, {
    message: 'type must be one of: TEXT, COLOR, BUTTON',
  })
  @IsOptional()
  type?: AttributeType;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status (true or false)',
  })
  @Type(() => Object)
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'sortOrder',
    default: 'sortOrder',
    enum: ['name', 'sortOrder', 'createdAt'],
    description: 'Column to sort by',
  })
  @IsIn(['name', 'sortOrder', 'createdAt'], {
    message: 'sortBy must be one of: name, sortOrder, createdAt',
  })
  @IsOptional()
  sortBy?: 'name' | 'sortOrder' | 'createdAt' = 'sortOrder';

  @ApiPropertyOptional({
    example: 'asc',
    default: 'asc',
    enum: ['asc', 'desc'],
    description: 'Sorting direction',
  })
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be one of: asc, desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
