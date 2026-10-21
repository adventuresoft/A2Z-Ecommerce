import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpdateReviewStatusDto {
  @ApiProperty({
    description: 'Updated moderation status',
    enum: ReviewStatus,
    example: ReviewStatus.APPROVED,
  })
  @IsEnum(ReviewStatus)
  @IsNotEmpty()
  status: ReviewStatus;

  @ApiPropertyOptional({
    description: 'Internal admin note or reason for rejection/approval',
    example: 'Verified authentic purchase with high-detail feedback.',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
