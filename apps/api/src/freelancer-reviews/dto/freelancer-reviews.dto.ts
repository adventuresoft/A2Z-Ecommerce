import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFreelancerReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Review comment (10 to 500 characters)' })
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  comment!: string;

  @ApiPropertyOptional({ description: 'Optional completed work photos (up to 3 URLs)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: 'You can upload at most 3 images' })
  @IsString({ each: true })
  images?: string[];
}

export class UpdateFreelancerReviewDto {
  @ApiPropertyOptional({ description: 'Updated rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Updated review comment (10 to 500 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Updated completed work photos (up to 3 URLs)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: 'You can upload at most 3 images' })
  @IsString({ each: true })
  images?: string[];
}

export class FreelancerReplyDto {
  @ApiProperty({ description: 'Public reply from the freelancer (5 to 400 characters)' })
  @IsString()
  @MinLength(5, { message: 'Reply must be at least 5 characters long' })
  @MaxLength(400, { message: 'Reply cannot exceed 400 characters' })
  reply!: string;
}

export class ReportFreelancerReviewDto {
  @ApiProperty({ description: 'Reason for reporting this review (10 to 500 characters)' })
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason!: string;
}

export class FreelancerReviewQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class AdminResolveReportDto {
  @ApiProperty({ description: 'Action to take', enum: ['HIDE_REVIEW', 'DISMISS_REPORT'] })
  @IsString()
  action!: 'HIDE_REVIEW' | 'DISMISS_REPORT';
}

