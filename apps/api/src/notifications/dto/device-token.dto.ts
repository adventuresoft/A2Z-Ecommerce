import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo or FCM/APNs push token for this mobile device',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token!: string;

  @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.ANDROID })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @ApiPropertyOptional({ example: 'pixel-7-device-id' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}

export class DeviceTokenResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty({ enum: DevicePlatform })
  platform!: DevicePlatform;

  @ApiPropertyOptional({ nullable: true })
  deviceId?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  lastUsedAt!: Date;
}

export class DeactivateDeviceTokenResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: true })
  deactivated!: boolean;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: 3 })
  unreadCount!: number;
}

export class MarkAllReadResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 5 })
  count!: number;
}
