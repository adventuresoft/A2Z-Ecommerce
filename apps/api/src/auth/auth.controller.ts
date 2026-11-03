import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  CheckPhoneDto,
  SendOtpDto,
  VerifyOtpDto,
  PhoneRegisterDto,
  PhoneLoginDto,
  PhoneResetPasswordDto,
} from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AccessPayload } from './interfaces/token-payload.interface.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== PHONE AUTHENTICATION ====================

  @Post('phone/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a mobile number is already registered' })
  @ApiResponse({ status: 200, description: 'Check status result' })
  async checkPhone(@Body() dto: CheckPhoneDto) {
    return this.authService.checkPhone(dto);
  }

  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 4-digit verification OTP code via MobiReach SMS' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 4-digit OTP and obtain a secure verification token' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('phone/register')
  @ApiOperation({ summary: 'Complete registration with verified phone token' })
  @ApiResponse({ status: 201, description: 'Account registered and logged in' })
  async phoneRegister(
    @Body() dto: PhoneRegisterDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.phoneRegister(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  @Post('phone/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with mobile number and password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  async phoneLogin(
    @Body() dto: PhoneLoginDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.phoneLogin(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  @Post('phone/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verified reset token' })
  @ApiResponse({ status: 200, description: 'Password reset and logged in successfully' })
  async phoneResetPassword(
    @Body() dto: PhoneResetPasswordDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.phoneResetPassword(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  // ==================== EMAIL AUTHENTICATION ====================

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.register(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'User login with credentials, returning JWT access and refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Exchange a valid refresh token for a new access and refresh token pair',
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const tokenFromCookie = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    const token = tokenFromCookie || dto?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refreshToken({ refreshToken: token });
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(),
      );
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Invalidate all current refresh tokens for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AccessPayload,
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (res) {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
    }
    return this.authService.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retrieve profile details for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: AccessPayload) {
    return this.authService.getProfile(user.sub);
  }
}
