import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FreelancerRegistrationService, FREELANCER_OTP_PURPOSE } from './freelancer-registration.service.js';
import { FreelancerStatus } from '@prisma/client';

describe('FreelancerRegistrationService', () => {
  let service: FreelancerRegistrationService;
  let prismaMock: any;
  let passwordMock: any;
  let smsMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      otpCode: {
        updateMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      freelancerProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    passwordMock = {
      hash: vi.fn().mockResolvedValue('hashed_otp'),
      verify: vi.fn(),
    };

    smsMock = {
      formatLocalPhoneNumber: vi.fn((phone: string) => phone.replace(/^\+88/, '')),
      sendSms: vi.fn().mockResolvedValue({ success: true }),
    };

    service = new FreelancerRegistrationService(
      prismaMock,
      passwordMock,
      smsMock,
    );
  });

  describe('requestOtp', () => {
    it('should throw ConflictException if phone is already linked to another user freelancer profile', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-2',
        phone: '01712345678',
        freelancerProfile: { id: 'prof-2' },
      });

      await expect(
        service.requestOtp({ phone: '01712345678' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should send OTP and return success if phone is available', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await service.requestOtp({ phone: '01712345678' });

      expect(result.success).toBe(true);
      expect(prismaMock.otpCode.updateMany).toHaveBeenCalledWith({
        where: {
          phone: '01712345678',
          purpose: FREELANCER_OTP_PURPOSE,
          isUsed: false,
        },
        data: { isUsed: true },
      });
      expect(prismaMock.otpCode.create).toHaveBeenCalled();
      expect(smsMock.sendSms).toHaveBeenCalled();
    });

    it('should throw BadRequestException if SMS sending fails', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      smsMock.sendSms.mockResolvedValue({ success: false, error: 'SMS Gateway Timeout' });

      await expect(
        service.requestOtp({ phone: '01712345678' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException if OTP not found or expired', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '01712345678', code: '1234' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException and increment attempts on wrong code', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hashed_otp',
        attempts: 1,
      });
      passwordMock.verify.mockResolvedValue(false);

      await expect(
        service.verifyOtp({ phone: '01712345678', code: '9999' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('should verify OTP, update user phone, and create draft profile if none exists', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hashed_otp',
        attempts: 0,
      });
      passwordMock.verify.mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({
        id: 'user-1',
        name: 'Karim',
        phone: '01712345678',
      });
      prismaMock.freelancerProfile.findUnique.mockResolvedValue(null);
      prismaMock.freelancerProfile.create.mockResolvedValue({
        id: 'prof-1',
        userId: 'user-1',
        displayName: 'Karim',
        status: FreelancerStatus.DRAFT,
      });

      const res = await service.verifyOtp(
        { phone: '01712345678', code: '1234' },
        'user-1',
      );

      expect(res.success).toBe(true);
      expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { isUsed: true },
      });
      expect(prismaMock.freelancerProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            status: FreelancerStatus.DRAFT,
          }),
        }),
      );
    });
  });
});

