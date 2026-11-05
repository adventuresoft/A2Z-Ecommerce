import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum FreelancerStatusEnum {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum RevisionStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class AdminFreelancerQueryDto {
  @ApiPropertyOptional({ enum: FreelancerStatusEnum })
  @IsOptional()
  @IsEnum(FreelancerStatusEnum)
  status?: FreelancerStatusEnum;

  @ApiPropertyOptional({ example: 'b819f071-7006-4b2a-89a1-8fe6ec67e91d' })
  @IsOptional()
  @IsUUID()
  professionId?: string;

  @ApiPropertyOptional({ example: 'Karim' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class RejectFreelancerDto {
  @ApiProperty({ example: 'Photo not clear and missing valid trade certification' })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  reason!: string;
}

export class SuspendFreelancerDto {
  @ApiProperty({ example: 'Customer complaints regarding misconduct' })
  @IsString()
  @IsNotEmpty({ message: 'Suspension reason is required' })
  reason!: string;
}

export class AdminRevisionQueryDto {
  @ApiPropertyOptional({ enum: RevisionStatusEnum, default: RevisionStatusEnum.PENDING })
  @IsOptional()
  @IsEnum(RevisionStatusEnum)
  status?: RevisionStatusEnum;

  @ApiPropertyOptional({ example: 'a984f47e-8c3b-410a-8bf8-d65eef83151b' })
  @IsOptional()
  @IsUUID()
  freelancerId?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class RejectRevisionDto {
  @ApiProperty({ example: 'Photo violates profile picture guidelines' })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  reason!: string;
}

