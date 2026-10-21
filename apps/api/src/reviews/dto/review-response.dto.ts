import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';

export class ReviewProductSnapshotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Wireless Noise-Canceling Headphones' })
  title: string;

  @ApiProperty({ example: 'wireless-noise-canceling-headphones' })
  slug: string;

  @ApiPropertyOptional({ example: '/uploads/products/headphones-thumb.jpg' })
  thumbnailUrl?: string | null;
}

export class ReviewUserSnapshotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'Sarah Johnson' })
  name: string;

  @ApiProperty({ example: 'sarah@example.com' })
  email: string;
}

export class ReviewOrderSnapshotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ example: 'AZ-2026-N491L0' })
  orderNumber: string;
}

export class ReviewResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174099' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  productId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  orderId?: string | null;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Exceptional sound quality' })
  title?: string | null;

  @ApiProperty({ example: 'These headphones exceed all expectations with crisp highs and deep bass.' })
  comment: string;

  @ApiProperty({ example: true })
  isVerifiedPurchase: boolean;

  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.APPROVED })
  status: ReviewStatus;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => ReviewProductSnapshotDto })
  product?: ReviewProductSnapshotDto;

  @ApiPropertyOptional({ type: () => ReviewUserSnapshotDto })
  user?: ReviewUserSnapshotDto;

  @ApiPropertyOptional({ type: () => ReviewOrderSnapshotDto })
  order?: ReviewOrderSnapshotDto | null;
}

export class PaginatedReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  items: ReviewResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
