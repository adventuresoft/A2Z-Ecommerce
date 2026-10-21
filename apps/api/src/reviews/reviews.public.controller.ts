import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, ReviewResponseDto } from './dto/index.js';

@ApiTags('Product Reviews')
@Controller('reviews')
export class ReviewsPublicController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Public list of approved reviews for a product with rating summary',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
  ) {
    return this.reviewsService.getProductApprovedReviews(
      productId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      rating ? Number(rating) : undefined,
    );
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Submit or edit a product review as an authenticated customer',
  })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  async submitReview(
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(user.sub, dto);
  }
}
