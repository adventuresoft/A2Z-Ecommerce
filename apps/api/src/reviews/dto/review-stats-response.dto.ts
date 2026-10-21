import { ApiProperty } from '@nestjs/swagger';

export class RatingDistributionDto {
  @ApiProperty({ example: 40 })
  star5: number;

  @ApiProperty({ example: 25 })
  star4: number;

  @ApiProperty({ example: 10 })
  star3: number;

  @ApiProperty({ example: 3 })
  star2: number;

  @ApiProperty({ example: 2 })
  star1: number;
}

export class ReviewStatsResponseDto {
  @ApiProperty({ example: 80 })
  totalReviews: number;

  @ApiProperty({ example: 15 })
  pendingCount: number;

  @ApiProperty({ example: 60 })
  approvedCount: number;

  @ApiProperty({ example: 5 })
  rejectedCount: number;

  @ApiProperty({ example: 4.6 })
  averageRating: number;

  @ApiProperty({ example: 52 })
  verifiedPurchaseCount: number;

  @ApiProperty({ type: RatingDistributionDto })
  ratingDistribution: RatingDistributionDto;
}
