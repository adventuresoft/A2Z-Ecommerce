import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (optional if sent via HTTP-only cookie)',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken?: string;

  @ApiPropertyOptional({
    example: 'android-pixel7-abc123',
    description: 'Optional client device identifier for per-device session tracking',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token of the current device session to revoke',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    example: 'android-pixel7-abc123',
    description: 'Device identifier of the current session to revoke',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;
}
