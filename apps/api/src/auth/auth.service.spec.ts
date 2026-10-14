import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let usersServiceMock: any;
  let passwordServiceMock: any;
  let tokenServiceMock: any;

  beforeEach(() => {
    usersServiceMock = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      incrementTokenVersion: vi.fn(),
    };
    passwordServiceMock = {
      hash: vi.fn(),
      verify: vi.fn(),
    };
    tokenServiceMock = {
      generateTokens: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
    authService = new AuthService(
      usersServiceMock,
      passwordServiceMock,
      tokenServiceMock,
    );
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      passwordServiceMock.hash.mockResolvedValue('argon2-hashed-pw');
      usersServiceMock.create.mockResolvedValue({
        id: 'u-1',
        email: 'test@az.local',
        name: 'Test Customer',
        phone: '+8801700000000',
        role: Role.CUSTOMER,
      });

      const res = await authService.register({
        email: 'test@az.local',
        password: 'Password123!',
        name: 'Test Customer',
        phone: '+8801700000000',
      });

      expect(res.id).toBe('u-1');
      expect(res.email).toBe('test@az.local');
      expect((res as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException if email already registered', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register({
          email: 'test@az.local',
          password: 'Password123!',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should log in active user with correct password', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'test@az.local',
        name: 'Test Customer',
        passwordHash: 'hashed-pw',
        role: Role.CUSTOMER,
        isActive: true,
        tokenVersion: 0,
      };
      usersServiceMock.findByEmail.mockResolvedValue(mockUser);
      passwordServiceMock.verify.mockResolvedValue(true);
      tokenServiceMock.generateTokens.mockResolvedValue({
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      });

      const res = await authService.login({
        email: 'test@az.local',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('access.jwt');
      expect(res.refreshToken).toBe('refresh.jwt');
      expect(res.user.email).toBe('test@az.local');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@az.local',
        passwordHash: 'hashed-pw',
        isActive: true,
      });
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@az.local', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if account is inactive', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@az.local',
        isActive: false,
      });

      await expect(
        authService.login({ email: 'test@az.local', password: 'Password123!' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens when refresh token and version are valid', async () => {
      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'u-1',
        tokenVersion: 2,
      });
      usersServiceMock.findById.mockResolvedValue({
        id: 'u-1',
        isActive: true,
        tokenVersion: 2,
      });
      tokenServiceMock.generateTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const res = await authService.refreshToken({ refreshToken: 'valid-refresh' });
      expect(res.accessToken).toBe('new-access');
      expect(res.refreshToken).toBe('new-refresh');
    });

    it('should throw UnauthorizedException when tokenVersion is mismatched', async () => {
      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'u-1',
        tokenVersion: 1,
      });
      usersServiceMock.findById.mockResolvedValue({
        id: 'u-1',
        isActive: true,
        tokenVersion: 2,
      });

      await expect(
        authService.refreshToken({ refreshToken: 'old-refresh' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout & profile', () => {
    it('should increment tokenVersion on logout', async () => {
      usersServiceMock.incrementTokenVersion.mockResolvedValue({});
      const res = await authService.logout('u-1');
      expect(res.message).toBe('Successfully logged out');
      expect(usersServiceMock.incrementTokenVersion).toHaveBeenCalledWith('u-1');
    });

    it('should return profile for valid user id', async () => {
      usersServiceMock.findById.mockResolvedValue({
        id: 'u-1',
        email: 'test@az.local',
        name: 'Test',
        role: Role.ADMIN,
        isActive: true,
      });
      const profile = await authService.getProfile('u-1');
      expect(profile.id).toBe('u-1');
      expect(profile.role).toBe(Role.ADMIN);
    });

    it('should throw NotFoundException if profile user does not exist', async () => {
      usersServiceMock.findById.mockResolvedValue(null);
      await expect(authService.getProfile('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});
