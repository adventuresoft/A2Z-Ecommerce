import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import type {
  AccessPayload,
  RefreshPayload,
  TokenPair,
} from './interfaces/token-payload.interface.js';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: {
    id: string;
    email: string;
    role: Role;
    tokenVersion: number;
  }): Promise<TokenPair> {
    const accessPayload: AccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: RefreshPayload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-insecure-access-secret-change-in-production',
    );
    const accessExpiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) ?? '15m') as any;

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-insecure-refresh-secret-change-in-production',
    );
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) ?? '7d') as any;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessPayload> {
    try {
      const secret = this.configService.get<string>(
        'JWT_SECRET',
        'dev-insecure-access-secret-change-in-production',
      );
      return await this.jwtService.verifyAsync<AccessPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshPayload> {
    try {
      const secret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'dev-insecure-refresh-secret-change-in-production',
      );
      return await this.jwtService.verifyAsync<RefreshPayload>(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
