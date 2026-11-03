import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';

export class CheckPhoneDto {
  @ApiProperty({ example: '01707819647', description: 'Bangladeshi mobile number' })
  @IsNotEmpty()
  @IsString()
  phone!: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '01707819647', description: 'Bangladeshi mobile number' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'SIGNUP', enum: ['SIGNUP', 'RESET_PASSWORD'] })
  @IsOptional()
  @IsString()
  purpose?: 'SIGNUP' | 'RESET_PASSWORD' = 'SIGNUP';
}

export class VerifyOtpDto {
  @ApiProperty({ example: '01707819647' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: '1234', description: '4-digit OTP verification code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'OTP code must be 4 digits' })
  code!: string;

  @ApiPropertyOptional({ example: 'SIGNUP', enum: ['SIGNUP', 'RESET_PASSWORD'] })
  @IsOptional()
  @IsString()
  purpose?: 'SIGNUP' | 'RESET_PASSWORD' = 'SIGNUP';
}

export class PhoneRegisterDto {
  @ApiProperty({ description: 'Verification token received after OTP validation' })
  @IsNotEmpty()
  @IsString()
  signupToken!: string;

  @ApiProperty({ example: 'Rahim' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class PhoneLoginDto {
  @ApiProperty({ example: '01707819647' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class PhoneResetPasswordDto {
  @ApiProperty({ description: 'Reset token received after OTP validation' })
  @IsNotEmpty()
  @IsString()
  resetToken!: string;

  @ApiProperty({ example: 'NewSecret123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

