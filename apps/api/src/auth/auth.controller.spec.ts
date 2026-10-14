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

  it('should call register on authService', async () => {
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
    };
    authServiceMock.register.mockResolvedValue(result);

    expect(await controller.register(dto)).toEqual(result);
    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
  });

  it('should call login on authService', async () => {
    const dto = { email: 'user@az.local', password: 'Password123!' };
    const result = {
      accessToken: 'acc',
      refreshToken: 'ref',
      user: { id: 'u-1' },
    };
    authServiceMock.login.mockResolvedValue(result);

    expect(await controller.login(dto)).toEqual(result);
    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });

  it('should call refresh on authService', async () => {
    const dto = { refreshToken: 'ref-token' };
    const result = { accessToken: 'new-acc', refreshToken: 'new-ref' };
    authServiceMock.refreshToken.mockResolvedValue(result);

    expect(await controller.refresh(dto)).toEqual(result);
    expect(authServiceMock.refreshToken).toHaveBeenCalledWith(dto);
  });

  it('should call logout with user.sub on authService', async () => {
    const user = { sub: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    authServiceMock.logout.mockResolvedValue({
      message: 'Successfully logged out',
    });

    expect(await controller.logout(user)).toEqual({
      message: 'Successfully logged out',
    });
    expect(authServiceMock.logout).toHaveBeenCalledWith('u-1');
  });

  it('should call me with user.sub on authService', async () => {
    const user = { sub: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    const profile = { id: 'u-1', email: 'user@az.local', role: Role.CUSTOMER };
    authServiceMock.getProfile.mockResolvedValue(profile);

    expect(await controller.me(user)).toEqual(profile);
    expect(authServiceMock.getProfile).toHaveBeenCalledWith('u-1');
  });
});
