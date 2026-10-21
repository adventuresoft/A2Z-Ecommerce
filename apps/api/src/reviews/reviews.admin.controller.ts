import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ReviewsService } from './reviews.service.js';
import {
  PaginatedReviewsResponseDto,
  QueryReviewsDto,
  ReviewResponseDto,
  ReviewStatsResponseDto,
  UpdateReviewStatusDto,
} from './dto/index.js';

@ApiTags('Admin Product Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('stats')
  @RequirePermission('engagement', 'read')
  @ApiOperation({
    summary: 'Retrieve review moderation metrics, rating averages and distribution',
  })
  @ApiResponse({ status: 200, type: ReviewStatsResponseDto })
  async getStats(): Promise<ReviewStatsResponseDto> {
    return this.reviewsService.getReviewStats();
  }

  @Get()
  @RequirePermission('engagement', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of reviews with search and multi-axis filters',
  })
  @ApiResponse({ status: 200, type: PaginatedReviewsResponseDto })
  async getReviews(
    @Query() query: QueryReviewsDto,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.getAdminReviews(query);
  }

  @Get(':id')
  @RequirePermission('engagement', 'read')
  @ApiOperation({ summary: 'Retrieve full review details by ID' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async getReviewById(@Param('id') id: string): Promise<ReviewResponseDto> {
    return this.reviewsService.getAdminReviewById(id);
  }

  @Patch(':id/status')
  @RequirePermission('engagement', 'update')
  @ApiOperation({
    summary: 'Moderate review: update status to APPROVED or REJECTED',
  })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.updateReviewStatus(id, dto);
  }

  @Delete(':id')
  @RequirePermission('engagement', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a product review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
