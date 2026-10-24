import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { REFRESH_COOKIE_NAME } from '../auth/auth.controller.js';
import { AccountService } from './account.service.js';
import { UpdateProfileDto, ChangePasswordDto } from './dto/index.js';

@ApiTags('Account')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Retrieve profile of authenticated customer' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AccessPayload) {
    return this.accountService.getProfile(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer display name and contact phone' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: AccessPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.accountService.updateProfile(user.sub, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password and revoke all active refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Incorrect current password or invalid new password',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.accountService.changePassword(user.sub, dto);
    if (res) {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
    }
    return result;
  }
}
