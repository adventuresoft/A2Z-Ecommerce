import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipCheckoutDto {
  @ApiProperty({ description: 'ID of the membership plan' })
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @ApiPropertyOptional({ description: 'Optional frontend redirect URL after payment' })
  @IsString()
  @IsOptional()
  redirectUrl?: string;
}

export class MembershipCallbackQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  invoice_number?: string;

  @IsString()
  @IsOptional()
  trx_id?: string;
}

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'মাসিক প্ল্যান (Monthly)' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  durationDays!: number;

  @ApiProperty({ example: 299 })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateMembershipPlanDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

