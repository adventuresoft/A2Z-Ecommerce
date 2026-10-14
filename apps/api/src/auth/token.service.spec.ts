import { describe, it, expect, beforeEach } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service.js';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    jwtService = new JwtService();
    configService = new ConfigService({
      JWT_SECRET: 'test-access-secret-1234567890123456',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret-1234567890123456',
      JWT_REFRESH_EXPIRES_IN: '7d',
    });
    tokenService = new TokenService(jwtService, configService);
  });

  const mockUser = {
    id: 'user-uuid-123',
    email: 'admin@az-ecommerce.local',
    role: Role.ADMIN,
    tokenVersion: 2,
  };

  it('should generate valid access and refresh tokens', async () => {
    const tokens = await tokenService.generateTokens(mockUser);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const accessPayload = await tokenService.verifyAccessToken(tokens.accessToken);
    expect(accessPayload.sub).toBe(mockUser.id);
    expect(accessPayload.email).toBe(mockUser.email);
    expect(accessPayload.role).toBe(mockUser.role);

    const refreshPayload = await tokenService.verifyRefreshToken(tokens.refreshToken);
    expect(refreshPayload.sub).toBe(mockUser.id);
    expect(refreshPayload.tokenVersion).toBe(mockUser.tokenVersion);
  });

  it('should throw UnauthorizedException when verifying invalid access token', async () => {
    await expect(tokenService.verifyAccessToken('invalid.token.payload')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when verifying invalid refresh token', async () => {
    await expect(tokenService.verifyRefreshToken('invalid.token.payload')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
