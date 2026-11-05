import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PortfolioItemDto {
  @ApiPropertyOptional({ example: 'c123f47e-8c3b-410a-8bf8-d65eef83151b' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'https://cdn.example.com/portfolio/work1.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Substation transformer wiring completion' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ManagePortfolioDto {
  @ApiProperty({ type: [PortfolioItemDto], description: 'Up to 10 portfolio items' })
  @IsArray()
  @ArrayMaxSize(10, { message: 'A maximum of 10 portfolio items can be added' })
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  items!: PortfolioItemDto[];
}

