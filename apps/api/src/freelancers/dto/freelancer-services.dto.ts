import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum ServicePriceTypeEnum {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  NEGOTIABLE = 'NEGOTIABLE',
}

export class ServiceItemDto {
  @ApiPropertyOptional({ example: 'b123f47e-8c3b-410a-8bf8-d65eef83151b' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Complete Ceiling Fan Repair & Installation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({
    example: 'Includes coil checking, capacitor replacement, and ceiling hook mounting.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ServicePriceTypeEnum,
    example: ServicePriceTypeEnum.FIXED,
  })
  @IsEnum(ServicePriceTypeEnum)
  priceType!: ServicePriceTypeEnum;

  @ApiPropertyOptional({ example: 500, description: 'Amount in BDT (required if not NEGOTIABLE)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount?: number;
}

export class ManageServicesDto {
  @ApiProperty({ type: [ServiceItemDto], description: 'Between 1 and 10 services' })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 service is required' })
  @ArrayMaxSize(10, { message: 'A maximum of 10 services can be offered' })
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services!: ServiceItemDto[];
}

