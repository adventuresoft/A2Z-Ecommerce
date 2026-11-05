import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from '../auth/password.service.js';
import { MobiReachSmsService } from '../auth/sms/mobireach-sms.service.js';
import {
  RequestFreelancerOtpDto,
  VerifyFreelancerOtpDto,
} from './dto/freelancer-registration.dto.js';
import { FreelancerStatus } from '@prisma/client';

export const FREELANCER_OTP_PURPOSE = 'FREELANCER_REGISTER';

@Injectable()
export class FreelancerRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly mobireachSmsService: MobiReachSmsService,
  ) {}

  cleanPhone(phone: string): string {
    return this.mobireachSmsService.formatLocalPhoneNumber(phone);
  }

  async requestOtp(dto: RequestFreelancerOtpDto, currentUserId?: string) {
    const phone = this.cleanPhone(dto.phone);
    if (!phone || phone.length < 10) {
      throw new BadRequestException('Please provide a valid mobile number');
    }

    // Check if phone is already linked to another user who has a freelancer profile
    const existingUserWithProfile = await this.prisma.user.findFirst({
      where: {
        phone,
        freelancerProfile: {
          isNot: null,
        },
      },
      include: {
        freelancerProfile: true,
      },
    });

    if (
      existingUserWithProfile &&
      (!currentUserId || existingUserWithProfile.id !== currentUserId)
    ) {
      throw new ConflictException(
        'This mobile number is already linked to an existing freelancer profile',
      );
    }

    // Generate 4-digit code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const codeHash = await this.passwordService.hash(otpCode);

    // Invalidate prior active OTPs
    await this.prisma.otpCode.updateMany({
      where: {
        phone,
        purpose: FREELANCER_OTP_PURPOSE,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Save new OTP record (5-minute expiry)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose: FREELANCER_OTP_PURPOSE,
        expiresAt,
        isUsed: false,
      },
    });

    const smsMessage = `Your A to Z Freelancer verification code is ${otpCode}. Valid for 5 minutes.`;
    const smsRes = await this.mobireachSmsService.sendSms(phone, smsMessage);

    if (!smsRes.success) {
      throw new BadRequestException(
        smsRes.error || 'Failed to send verification SMS. Please try again.',
      );
    }

    return {
      success: true,
      phone,
      expiresInSeconds: 300,
      resendInSeconds: 60,
      message: 'Verification code sent successfully',
    };
  }

  async verifyOtp(dto: VerifyFreelancerOtpDto, userId: string) {
    const phone = this.cleanPhone(dto.phone);

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: FREELANCER_OTP_PURPOSE,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'Verification code has expired or is invalid. Please request a new code.',
      );
    }

    if (otpRecord.attempts >= 5) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        'Too many invalid attempts. Please request a new code.',
      );
    }

    const isMatch = await this.passwordService.verify(
      otpRecord.codeHash,
      dto.code,
    );
    if (!isMatch) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid 4-digit verification code.');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update user phone if needed and fetch user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    // Create or retrieve DRAFT profile
    let profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        profession: true,
        locations: true,
        services: true,
        skills: {
          include: { skill: true },
        },
        portfolio: true,
      },
    });

    if (!profile) {
      profile = await this.prisma.freelancerProfile.create({
        data: {
          userId,
          displayName: user.name || 'Professional',
          status: FreelancerStatus.DRAFT,
        },
        include: {
          profession: true,
          locations: true,
          services: true,
          skills: {
            include: { skill: true },
          },
          portfolio: true,
        },
      });
    }

    return {
      success: true,
      message: 'Mobile number verified successfully',
      profile,
    };
  }
}

