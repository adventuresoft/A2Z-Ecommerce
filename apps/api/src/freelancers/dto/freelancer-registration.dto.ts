import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestFreelancerOtpDto {
  @ApiProperty({
    example: '01712345678',
    description: '11-digit Bangladeshi mobile number or E.164 +8801XXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+?8801|01)[3-9]\d{8}$/, {
    message: 'Please provide a valid 11-digit Bangladeshi mobile number',
  })
  phone!: string;
}

export class VerifyFreelancerOtpDto {
  @ApiProperty({
    example: '01712345678',
    description: '11-digit Bangladeshi mobile number or E.164 +8801XXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '1234', description: '4-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'OTP code must be 4 digits' })
  code!: string;
}

