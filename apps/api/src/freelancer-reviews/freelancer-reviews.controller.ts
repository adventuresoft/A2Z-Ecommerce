import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FreelancerReviewsService } from './freelancer-reviews.service.js';
import {
  AdminResolveReportDto,
  CreateFreelancerReviewDto,
  FreelancerReplyDto,
  FreelancerReviewQueryDto,
  ReportFreelancerReviewDto,
  UpdateFreelancerReviewDto,
} from './dto/freelancer-reviews.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Freelancer Reviews')
@Controller()
export class FreelancerReviewsController {
  constructor(private readonly reviewsService: FreelancerReviewsService) {}

  // =========================================================================
  // Public & Client Endpoints
  // =========================================================================

  @Get('marketplace/freelancers/:id/reviews')
  @ApiOperation({ summary: 'List approved reviews and ratings summary for a professional (Public)' })
  listReviews(
    @Param('id') freelancerId: string,
    @Query() query: FreelancerReviewQueryDto,
  ) {
    return this.reviewsService.listReviews(freelancerId, query);
  }

  @Get('marketplace/freelancers/:id/reviews/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user review for this professional, if any' })
  getMyReview(
    @Param('id') freelancerId: string,
    @CurrentUser() user: AccessPayload,
  ) {
    return this.reviewsService.getMyReview(freelancerId, user.sub);
  }

  @Post('marketplace/freelancers/:id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a review (Verified contact required, 1 review per client)' })
  createReview(
    @Param('id') freelancerId: string,
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateFreelancerReviewDto,
  ) {
    return this.reviewsService.createReview(freelancerId, user.sub, dto);
  }

  @Put('marketplace/freelancers/:id/reviews/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit submitted review (Allowed at most ONCE)' })
  updateReview(
    @Param('id') freelancerId: string,
    @CurrentUser() user: AccessPayload,
    @Body() dto: UpdateFreelancerReviewDto,
  ) {
    return this.reviewsService.updateReview(freelancerId, user.sub, dto);
  }

  // =========================================================================
  // Freelancer Actions
  // =========================================================================

  @Post('freelancer/reviews/:id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post a public reply to a review (Single reply permitted)' })
  replyToReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: AccessPayload,
    @Body() dto: FreelancerReplyDto,
  ) {
    return this.reviewsService.replyToReview(reviewId, user.sub, dto);
  }

  @Post('freelancer/reviews/:id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report an abusive or fake review to admin' })
  reportReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: AccessPayload,
    @Body() dto: ReportFreelancerReviewDto,
  ) {
    return this.reviewsService.reportReview(reviewId, user.sub, dto);
  }

  // =========================================================================
  // Admin Endpoints
  // =========================================================================

  @Get('admin/freelancer-reviews/reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reported reviews for moderation (Admin)' })
  listReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.listReports(page, limit);
  }

  @Post('admin/freelancer-reviews/reports/:id/action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a reported review (Hide review or dismiss report)' })
  resolveReport(
    @Param('id') reportId: string,
    @CurrentUser() user: AccessPayload,
    @Body() dto: AdminResolveReportDto,
  ) {
    return this.reviewsService.resolveReport(reportId, user.sub, dto);
  }
}

