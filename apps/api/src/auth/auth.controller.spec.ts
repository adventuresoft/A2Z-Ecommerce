import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn(),
      getProfile: vi.fn(),
    };
    controller = new AuthController(authServiceMock as unknown as AuthService);
  });

  it('should call register on authService and set refresh cookie if token present', async () => {
    const dto = {
      email: 'user@az.local',
      password: 'Password123!',
      name: 'User',
    };
    const result = {
      id: 'u-1',
      email: dto.email,
      name: dto.name,
      role: Role.CUSTOMER,
      accessToken: 'acc',
      refreshToken: 'ref-token',
    };
    authServiceMock.register.mockResolvedValue(result);

    const resMock = { cookie: vi.fn(), clearCookie: vi.fn() } as any;
    const res = await controller.register(dto, resMock);

    expect(res).toEqual(result);
    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(resMock.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'ref-token',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('should call login on authService and set refresh cookie', async () => {
    const dto = { email: 'user@az.local', password: 'Password123!' };
    const result = {
      accessToken: 'acc',
      refreshToken: 'ref-jwt',
      user: { id: 'u-1' },
    };
    authServiceMock.login.mockResolvedValue(result);

    const resMock = { cookie: vi.fn() } as any;
    const res = await controller.login(dto, resMock);

    expect(res).toEqual(result);
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(resMock.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'ref-jwt',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('should refresh using cookie and rotate refresh cookie', async () => {
    const reqMock = { cookies: { refreshToken: 'cookie-ref-token' } } as any;
    const resMock = { cookie: vi.fn() } as any;
    const result = { accessToken: 'new-acc', refreshToken: 'rotated-ref' };
    authServiceMock.refreshToken.mockResolvedValue(result);

    const res = await controller.refresh(reqMock, {} as any, resMock);

    expect(res).toEqual(result);
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith({
      refreshToken: 'cookie-ref-token',
    });
    expect(resMock.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rotated-ref',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('should refresh using body dto fallback when cookie is absent', async () => {
    const reqMock = { cookies: {} } as any;
    const resMock = { cookie: vi.fn() } as any;
    const dto = { refreshToken: 'body-ref-token' };
    const result = { accessToken: 'new-acc', refreshToken: 'rotated-ref' };
    authServiceMock.refreshToken.mockResolvedValue(result);

    const res = await controller.refresh(reqMock, dto, resMock);

    expect(res).toEqual(result);
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith({
      refreshToken: 'body-ref-token',
    });
    expect(resMock.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rotated-ref',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('should throw UnauthorizedException on refresh when neither cookie nor body token exists', async () => {
    const reqMock = { cookies: {} } as any;
    const resMock = { cookie: vi.fn() } as any;

    await expect(controller.refresh(reqMock, {} as any, resMock)).rejects.toThrow(
      'Refresh token is required',
    );
  });

  it('should call logout, clear refresh cookie and increment tokenVersion', async () => {
    const user = { sub: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    const resMock = { clearCookie: vi.fn() } as any;
    authServiceMock.logout.mockResolvedValue({
      message: 'Successfully logged out',
    });

    const res = await controller.logout(user, resMock);

    expect(res).toEqual({ message: 'Successfully logged out' });
    expect(authServiceMock.logout).toHaveBeenCalledWith('u-1');
    expect(resMock.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ httpOnly: true, path: '/api/v1/auth' }),
    );
  });

  it('should call me with user.sub on authService', async () => {
    const user = { sub: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    const profile = { id: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    authServiceMock.getProfile.mockResolvedValue(profile);

    expect(await controller.me(user)).toEqual(profile);
    expect(authServiceMock.getProfile).toHaveBeenCalledWith('u-1');
  });
});
