import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { TokenService } from '../token.service.js';
import { Role } from '@prisma/client';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let tokenServiceMock: any;

  beforeEach(() => {
    tokenServiceMock = {
      verifyAccessToken: vi.fn(),
    };
    guard = new JwtAuthGuard(tokenServiceMock as unknown as TokenService);
  });

  function createMockContext(authHeader?: string): { context: ExecutionContext; request: any } {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('should allow access with valid Bearer token and attach user to request', async () => {
    const { context, request } = createMockContext('Bearer valid.jwt.token');
    const mockPayload = { sub: 'u-1', email: 'test@az.local', role: Role.CUSTOMER };
    tokenServiceMock.verifyAccessToken.mockResolvedValue(mockPayload);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toEqual(mockPayload);
    expect(tokenServiceMock.verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');
  });

  it('should throw UnauthorizedException if header is missing or not Bearer', async () => {
    const { context } = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);

    const { context: basicContext } = createMockContext('Basic 123');
    await expect(guard.canActivate(basicContext)).rejects.toThrow(UnauthorizedException);
  });
});
