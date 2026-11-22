import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service.js';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let usersServiceMock: any;
  let passwordServiceMock: any;
  let tokenServiceMock: any;
  let mobireachSmsMock: any;
  let prismaMock: any;

  beforeEach(() => {
    usersServiceMock = {
      findByEmail: vi.fn(),
      findByPhone: vi.fn().mockResolvedValue(null),
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
      generateVerificationToken: vi.fn().mockResolvedValue('mock-verification-token'),
      verifyVerificationToken: vi.fn(),
    };
    mobireachSmsMock = {
      formatLocalPhoneNumber: vi.fn((p) => p),
      normalizePhoneNumber: vi.fn((p) => p),
      sendSms: vi.fn().mockResolvedValue({ success: true, isMock: true }),
    };
    prismaMock = {
      otpCode: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
      refreshSession: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    authService = new AuthService(
      usersServiceMock,
      passwordServiceMock,
      tokenServiceMock,
      mobireachSmsMock,
      prismaMock,
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

  describe('per-device RefreshSession, OTP cooldown, and production guardrails', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should persist RefreshSession on login and rotate SHA-256 hash on refresh', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'mobile@az.local',
        name: 'Mobile User',
        passwordHash: 'hashed-pw',
        role: Role.CUSTOMER,
        isActive: true,
        tokenVersion: 0,
      };
      usersServiceMock.findByEmail.mockResolvedValue(mockUser);
      passwordServiceMock.verify.mockResolvedValue(true);
      tokenServiceMock.generateTokens.mockResolvedValue({
        accessToken: 'acc-1',
        refreshToken: 'ref-1',
      });

      await authService.login({
        email: 'mobile@az.local',
        password: 'Password123!',
        deviceId: 'pixel-7',
      });

      expect(prismaMock.refreshSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-1',
            deviceId: 'pixel-7',
            tokenHash: createHash('sha256').update('ref-1').digest('hex'),
          }),
        }),
      );

      // Now rotate valid token
      const validHash = createHash('sha256').update('ref-1').digest('hex');
      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'u-1',
        tokenVersion: 0,
        sid: 'sess-1',
        deviceId: 'pixel-7',
      });
      usersServiceMock.findById.mockResolvedValue(mockUser);
      prismaMock.refreshSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        userId: 'u-1',
        deviceId: 'pixel-7',
        tokenHash: validHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      tokenServiceMock.generateTokens.mockResolvedValue({
        accessToken: 'acc-2',
        refreshToken: 'ref-2',
      });

      const rotated = await authService.refreshToken({ refreshToken: 'ref-1' });
      expect(rotated.accessToken).toBe('acc-2');
      expect(prismaMock.refreshSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-1' },
          data: expect.objectContaining({
            tokenHash: createHash('sha256').update('ref-2').digest('hex'),
          }),
        }),
      );
    });

    it('should detect rotated refresh token replay and revoke the session', async () => {
      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'u-1',
        tokenVersion: 0,
        sid: 'sess-1',
      });
      usersServiceMock.findById.mockResolvedValue({
        id: 'u-1',
        isActive: true,
        tokenVersion: 0,
      });
      prismaMock.refreshSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        userId: 'u-1',
        deviceId: 'pixel-7',
        tokenHash: createHash('sha256').update('current-newest-ref').digest('hex'),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        authService.refreshToken({ refreshToken: 'replayed-old-ref' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaMock.refreshSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('should revoke only the active device session on single-device logout without incrementing tokenVersion', async () => {
      const res = await authService.logout('u-1', { deviceId: 'pixel-7' });
      expect(res.message).toBe('Successfully logged out');
      expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u-1', deviceId: 'pixel-7', revokedAt: null },
        }),
      );
      expect(usersServiceMock.incrementTokenVersion).not.toHaveBeenCalled();
    });

    it('should reject OTP send within 60-second cooldown with HTTP 429', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp-recent',
        phone: '01707819647',
        purpose: 'SIGNUP',
        createdAt: new Date(Date.now() - 10_000),
      });

      try {
        await authService.sendOtp({ phone: '01707819647', purpose: 'SIGNUP' });
        expect.unreachable('Expected 429 Too Many Requests');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
      expect(mobireachSmsMock.sendSms).not.toHaveBeenCalled();
    });

    it('should block customer@az-ecommerce.local dev backdoor in production', async () => {
      process.env.NODE_ENV = 'production';
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'u-demo',
        email: 'customer@az-ecommerce.local',
        passwordHash: 'real-hash',
        isActive: true,
        role: Role.CUSTOMER,
      });
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'customer@az-ecommerce.local',
          password: 'Customer123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should omit devOtp from sendOtp response in production', async () => {
      process.env.NODE_ENV = 'production';
      prismaMock.otpCode.findFirst.mockResolvedValue(null);
      passwordServiceMock.hash.mockResolvedValue('otp-hash');

      const res = await authService.sendOtp({ phone: '01707819647', purpose: 'SIGNUP' });
      expect(res.success).toBe(true);
      expect((res as any).devOtp).toBeUndefined();
    });
  });
});
