import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserSummaryDto {
  @ApiProperty({ example: '8b2c4d6e-1234-4a5b-9c8d-1234567890ab' })
  id!: string;

  @ApiPropertyOptional({ example: 'customer@example.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: 'Rahim Ahmed' })
  name!: string;

  @ApiPropertyOptional({ example: '01707819647', nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER })
  role!: Role;
}

export class AuthProfileResponseDto extends AuthUserSummaryDto {
  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true })
  emailVerifiedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class CheckPhoneResponseDto {
  @ApiProperty({ example: '01707819647' })
  phone!: string;

  @ApiProperty({ example: true })
  exists!: boolean;

  @ApiPropertyOptional({ example: 'Rahim Ahmed' })
  name?: string;
}

export class SendOtpResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '01707819647' })
  phone!: string;

  @ApiProperty({ example: 300 })
  expiresInSeconds!: number;

  @ApiProperty({ example: 60 })
  resendInSeconds!: number;

  @ApiProperty({ example: 'Verification code sent successfully' })
  message!: string;

  @ApiPropertyOptional({ example: '1234', description: 'Development-only OTP code (omitted in production)' })
  devOtp?: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token!: string;

  @ApiProperty({ example: '01707819647' })
  phone!: string;

  @ApiProperty({ example: 'SIGNUP', enum: ['SIGNUP', 'RESET_PASSWORD'] })
  purpose!: string;
}

export class AuthTokenPairResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;
}

export class AuthLoginResponseDto extends AuthTokenPairResponseDto {
  @ApiProperty({ type: AuthUserSummaryDto })
  user!: AuthUserSummaryDto;
}

export class AuthRegisterResponseDto extends AuthLoginResponseDto {
  @ApiProperty({ example: '8b2c4d6e-1234-4a5b-9c8d-1234567890ab' })
  id!: string;

  @ApiPropertyOptional({ example: 'customer@example.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: 'Rahim Ahmed' })
  name!: string;

  @ApiPropertyOptional({ example: '01707819647', nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER })
  role!: Role;
}

export class AuthResetPasswordResponseDto extends AuthLoginResponseDto {
  @ApiProperty({ example: 'Password reset successful' })
  message!: string;
}

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'Successfully logged out' })
  message!: string;
}
