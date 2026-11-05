import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FreelancerRegistrationService } from './freelancer-registration.service.js';
import {
  RequestFreelancerOtpDto,
  VerifyFreelancerOtpDto,
} from './dto/freelancer-registration.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';

@ApiTags('Freelancer Registration')
@Controller('freelancer/register')
export class FreelancerRegistrationController {
  constructor(
    private readonly registrationService: FreelancerRegistrationService,
  ) {}

  @Post('otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP code for freelancer registration' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 409, description: 'Phone already in use by another freelancer' })
  async requestOtp(
    @Body() dto: RequestFreelancerOtpDto,
    @CurrentUser() user?: AccessPayload,
  ) {
    return this.registrationService.requestOtp(dto, user?.sub);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code and create or resume draft freelancer profile',
  })
  @ApiResponse({ status: 200, description: 'OTP verified, draft profile ready' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  async verifyOtp(
    @Body() dto: VerifyFreelancerOtpDto,
    @CurrentUser() user: AccessPayload,
  ) {
    return this.registrationService.verifyOtp(dto, user.sub);
  }
}

