import {
  Controller,
  Delete,
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
import {
  UpdateProfileDto,
  ChangePasswordDto,
  DeleteAccountDto,
  AccountOverviewResponseDto,
  AccountProfileResponseDto,
  AccountMessageResponseDto,
} from './dto/index.js';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Retrieve account overview stats and recent orders' })
  @ApiResponse({
    status: 200,
    description: 'Account overview retrieved successfully',
    type: AccountOverviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOverview(
    @CurrentUser() user: AccessPayload,
  ): Promise<AccountOverviewResponseDto> {
    return this.accountService.getAccountOverview(user.sub);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Retrieve profile of authenticated customer' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: AccountProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @CurrentUser() user: AccessPayload,
  ): Promise<AccountProfileResponseDto> {
    return this.accountService.getProfile(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer display name and contact phone' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: AccountProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: AccessPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<AccountProfileResponseDto> {
    return this.accountService.updateProfile(user.sub, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password and revoke all active refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: AccountMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Incorrect current password or invalid new password',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: AccessPayload,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<AccountMessageResponseDto> {
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

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently deactivate and anonymize the authenticated customer account while preserving order history',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    type: AccountMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid password or verification token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @CurrentUser() user: AccessPayload,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<AccountMessageResponseDto> {
    const result = await this.accountService.deleteAccount(user.sub, dto);
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
