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
import { Throttle } from '@nestjs/throttler';
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
  LogoutDto,
  CheckPhoneDto,
  SendOtpDto,
  VerifyOtpDto,
  PhoneRegisterDto,
  PhoneLoginDto,
  PhoneResetPasswordDto,
  CheckPhoneResponseDto,
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  AuthRegisterResponseDto,
  AuthLoginResponseDto,
  AuthResetPasswordResponseDto,
  AuthTokenPairResponseDto,
  AuthMessageResponseDto,
  AuthProfileResponseDto,
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

  private extractSessionMeta(req?: Request, bodyDeviceId?: string) {
    const headerDeviceId = req?.headers?.['x-device-id'];
    const deviceId =
      bodyDeviceId ||
      (typeof headerDeviceId === 'string' ? headerDeviceId : undefined);
    const userAgent =
      typeof req?.headers?.['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined;
    return deviceId || userAgent ? { deviceId, userAgent } : undefined;
  }

  // ==================== PHONE AUTHENTICATION ====================

  @Post('phone/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a mobile number is already registered' })
  @ApiResponse({ status: 200, description: 'Check status result', type: CheckPhoneResponseDto })
  async checkPhone(@Body() dto: CheckPhoneDto): Promise<CheckPhoneResponseDto> {
    return this.authService.checkPhone(dto);
  }

  @Post('phone/send-otp')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 4-digit verification OTP code via MobiReach SMS' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully', type: SendOtpResponseDto })
  @ApiResponse({ status: 429, description: 'Too many OTP requests or cooldown active' })
  async sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpResponseDto> {
    return this.authService.sendOtp(dto);
  }

  @Post('phone/verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 4-digit OTP and obtain a secure verification token' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully', type: VerifyOtpResponseDto })
  @ApiResponse({ status: 429, description: 'Too many verification attempts' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  @Post('phone/register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete registration with verified phone token' })
  @ApiResponse({ status: 201, description: 'Account registered and logged in', type: AuthRegisterResponseDto })
  async phoneRegister(
    @Body() dto: PhoneRegisterDto,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
  ): Promise<AuthRegisterResponseDto> {
    const meta = this.extractSessionMeta(req, dto.deviceId);
    const result = meta
      ? await this.authService.phoneRegister(dto, meta)
      : await this.authService.phoneRegister(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  @Post('phone/login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with mobile number and password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully', type: AuthLoginResponseDto })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async phoneLogin(
    @Body() dto: PhoneLoginDto,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
  ): Promise<AuthLoginResponseDto> {
    const meta = this.extractSessionMeta(req, dto.deviceId);
    const result = meta
      ? await this.authService.phoneLogin(dto, meta)
      : await this.authService.phoneLogin(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  @Post('phone/reset-password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verified reset token' })
  @ApiResponse({ status: 200, description: 'Password reset and logged in successfully', type: AuthResetPasswordResponseDto })
  async phoneResetPassword(
    @Body() dto: PhoneResetPasswordDto,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
  ): Promise<AuthResetPasswordResponseDto> {
    const meta = this.extractSessionMeta(req, dto.deviceId);
    const result = meta
      ? await this.authService.phoneResetPassword(dto, meta)
      : await this.authService.phoneResetPassword(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  // ==================== EMAIL AUTHENTICATION ====================

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully', type: AuthRegisterResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
  ): Promise<AuthRegisterResponseDto> {
    const meta = this.extractSessionMeta(req, dto.deviceId);
    const result = meta
      ? await this.authService.register(dto, meta)
      : await this.authService.register(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with credentials, returning JWT access and refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthLoginResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
  ): Promise<AuthLoginResponseDto> {
    const meta = this.extractSessionMeta(req, dto.deviceId);
    const result = meta
      ? await this.authService.login(dto, meta)
      : await this.authService.login(dto);
    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a valid refresh token for a new access and refresh token pair',
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully', type: AuthTokenPairResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  @ApiResponse({ status: 429, description: 'Too many refresh requests' })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<AuthTokenPairResponseDto> {
    const tokenFromCookie = (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE_NAME
    ];
    const token = tokenFromCookie || dto?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const meta = this.extractSessionMeta(req, dto?.deviceId);
    const payload: RefreshTokenDto = dto?.deviceId
      ? { refreshToken: token, deviceId: dto.deviceId }
      : { refreshToken: token };
    const result = meta
      ? await this.authService.refreshToken(payload, meta)
      : await this.authService.refreshToken(payload);

    if (result && 'refreshToken' in result && typeof result.refreshToken === 'string' && res) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke the current device refresh session (or all sessions if no device token supplied)',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully', type: AuthMessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AccessPayload,
    @Res({ passthrough: true }) res?: Response,
    @Req() req?: Request,
    @Body() dto?: LogoutDto,
  ): Promise<AuthMessageResponseDto> {
    if (res) {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
    }

    const tokenFromCookie = (req?.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE_NAME
    ];
    const headerDeviceId = req?.headers?.['x-device-id'];
    const refreshToken = dto?.refreshToken || tokenFromCookie;
    const deviceId =
      dto?.deviceId || (typeof headerDeviceId === 'string' ? headerDeviceId : undefined);

    if (refreshToken || deviceId) {
      return this.authService.logout(user.sub, { refreshToken, deviceId });
    }
    return this.authService.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve profile details for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: AuthProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: AccessPayload): Promise<AuthProfileResponseDto> {
    return this.authService.getProfile(user.sub);
  }
}
