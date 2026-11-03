import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('PhoneAuth in AuthService', () => {
  let authService: AuthService;
  let usersServiceMock: any;
  let passwordServiceMock: any;
  let tokenServiceMock: any;
  let mobireachSmsMock: any;
  let prismaMock: any;

  beforeEach(() => {
    usersServiceMock = {
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      incrementTokenVersion: vi.fn(),
    };
    passwordServiceMock = {
      hash: vi.fn().mockImplementation((val) => Promise.resolve(`hash-${val}`)),
      verify: vi.fn(),
    };
    tokenServiceMock = {
      generateTokens: vi.fn().mockResolvedValue({ accessToken: 'access-123', refreshToken: 'refresh-123' }),
      generateVerificationToken: vi.fn().mockResolvedValue('signup-token-456'),
      verifyVerificationToken: vi.fn(),
    };
    mobireachSmsMock = {
      formatLocalPhoneNumber: vi.fn((p: string) => {
        const cleaned = p.replace(/[^\d]/g, '');
        return cleaned.startsWith('880') ? cleaned.slice(2) : cleaned;
      }),
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
    };
    authService = new AuthService(
      usersServiceMock,
      passwordServiceMock,
      tokenServiceMock,
      mobireachSmsMock,
      prismaMock,
    );
  });

  describe('checkPhone', () => {
    it('should return exists: false when phone is not registered', async () => {
      usersServiceMock.findByPhone.mockResolvedValue(null);
      const res = await authService.checkPhone({ phone: '01707819647' });
      expect(res.exists).toBe(false);
      expect(res.phone).toBe('01707819647');
    });

    it('should return exists: true when phone is registered', async () => {
      usersServiceMock.findByPhone.mockResolvedValue({ id: 'u-1', name: 'Karim', phone: '01707819647' });
      const res = await authService.checkPhone({ phone: '01707819647' });
      expect(res.exists).toBe(true);
      expect(res.name).toBe('Karim');
    });
  });

  describe('sendOtp', () => {
    it('should generate and send 4-digit OTP via SMS', async () => {
      const res = await authService.sendOtp({ phone: '01707819647', purpose: 'SIGNUP' });
      expect(res.success).toBe(true);
      expect(prismaMock.otpCode.create).toHaveBeenCalled();
      expect(mobireachSmsMock.sendSms).toHaveBeenCalled();
      expect((res as any).devOtp).toBeUndefined();
    });
  });

  describe('verifyOtp', () => {
    it('should return verification token on correct 4-digit code', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp-1',
        phone: '01707819647',
        codeHash: 'hash-1234',
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
      });
      passwordServiceMock.verify.mockResolvedValue(true);

      const res = await authService.verifyOtp({ phone: '01707819647', code: '1234' });
      expect(res.verified).toBe(true);
      expect(res.token).toBe('signup-token-456');
      expect(prismaMock.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isUsed: true } })
      );
    });

    it('should throw BadRequestException if code is invalid', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp-1',
        phone: '01707819647',
        codeHash: 'hash-1234',
        attempts: 1,
        expiresAt: new Date(Date.now() + 60000),
      });
      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        authService.verifyOtp({ phone: '01707819647', code: '9999' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('phoneRegister', () => {
    it('should create new user and return tokens when token is verified', async () => {
      tokenServiceMock.verifyVerificationToken.mockResolvedValue({
        phone: '01707819647',
        purpose: 'SIGNUP',
      });
      usersServiceMock.findByPhone.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue({
        id: 'new-u1',
        phone: '01707819647',
        name: 'John Doe',
        email: null,
        role: Role.CUSTOMER,
      });

      const res = await authService.phoneRegister({
        signupToken: 'signup-token-456',
        name: 'John Doe',
        password: 'Password123!',
      });

      expect(res.user.phone).toBe('01707819647');
      expect(res.accessToken).toBe('access-123');
    });
  });

  describe('phoneLogin', () => {
    it('should authenticate user with phone and password', async () => {
      usersServiceMock.findByPhone.mockResolvedValue({
        id: 'u-1',
        phone: '01707819647',
        passwordHash: 'hash-pass',
        isActive: true,
        role: Role.CUSTOMER,
      });
      passwordServiceMock.verify.mockResolvedValue(true);

      const res = await authService.phoneLogin({
        phone: '01707819647',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('access-123');
    });
  });
});

