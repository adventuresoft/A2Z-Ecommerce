import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createImageUploadOptions } from '../common/uploads/image-upload.js';
import { FreelancerProfileService } from './freelancer-profile.service.js';
import {
  UpdateProfileDto,
  UpdateAvailabilityDto,
  ManageLocationsDto,
  ManageServicesDto,
  ManageSkillsDto,
  ManagePortfolioDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Freelancer Profile')
@Controller('freelancer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FreelancerProfileController {
  constructor(private readonly profileService: FreelancerProfileService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user freelancer profile with relations (creates draft if new)' })
  async getProfile(@CurrentUser() user: AccessPayload) {
    return this.profileService.getOrCreateProfile(user.sub);
  }

  @Post('profile/upload-photo')
  @ApiOperation({
    summary: 'Upload freelancer profile photo (JPG, PNG, WEBP, max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('freelancers', 'photo')),
  )
  async uploadPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      photoUrl: `/uploads/freelancers/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('profile/upload-portfolio')
  @ApiOperation({
    summary: 'Upload freelancer portfolio work image (JPG, PNG, WEBP, max 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createImageUploadOptions('freelancers', 'portfolio'),
    ),
  )
  async uploadPortfolioImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      imageUrl: `/uploads/freelancers/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update core profile information (sensitive fields routed to revision if approved)',
  })
  async updateProfile(
    @CurrentUser() user: AccessPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.sub, dto);
  }

  @Put('availability')
  @ApiOperation({ summary: 'Update freelancer availability status immediately' })
  async updateAvailability(
    @CurrentUser() user: AccessPayload,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.profileService.updateAvailability(user.sub, dto);
  }

  @Put('locations')
  @ApiOperation({ summary: 'Set service locations (1 to 5, exactly one primary)' })
  async manageLocations(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ManageLocationsDto,
  ) {
    return this.profileService.manageLocations(user.sub, dto);
  }

  @Put('services')
  @ApiOperation({ summary: 'Set offered services (1 to 10 items)' })
  async manageServices(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ManageServicesDto,
  ) {
    return this.profileService.manageServices(user.sub, dto);
  }

  @Put('skills')
  @ApiOperation({ summary: 'Associate taxonomy skills (up to 10 items)' })
  async manageSkills(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ManageSkillsDto,
  ) {
    return this.profileService.manageSkills(user.sub, dto);
  }

  @Put('portfolio')
  @ApiOperation({ summary: 'Manage portfolio items (up to 10 items)' })
  async managePortfolio(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ManagePortfolioDto,
  ) {
    return this.profileService.managePortfolio(user.sub, dto);
  }

  @Post('profile/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit completed profile for admin moderation' })
  @ApiResponse({ status: 200, description: 'Profile submitted to PENDING status' })
  @ApiResponse({ status: 400, description: 'Missing required sections' })
  async submitProfile(@CurrentUser() user: AccessPayload) {
    return this.profileService.submitProfile(user.sub);
  }

  @Get('reveals')
  @ApiOperation({ summary: 'List clients who revealed this freelancer phone number' })
  async getReveals(@CurrentUser() user: AccessPayload) {
    return this.profileService.getReveals(user.sub);
  }
}

