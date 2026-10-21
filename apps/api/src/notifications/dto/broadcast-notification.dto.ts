import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationType, Role } from '@prisma/client';

export class BroadcastNotificationDto {
  @ApiPropertyOptional({
    description: 'Target audience role. If omitted, sends to all active users.',
    enum: Role,
    example: Role.CUSTOMER,
  })
  @IsEnum(Role)
  @IsOptional()
  targetRole?: Role;

  @ApiProperty({
    description: 'Notification category type',
    enum: NotificationType,
    example: NotificationType.PROMOTION,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'Broadcast headline / title',
    example: 'Weekend Flash Sale - 20% Off All Electronics',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Broadcast body text',
    example: 'Enjoy 20% discount on all headphones and accessories this weekend using code FLASH20.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Destination URL link',
    example: '/catalog/products',
  })
  @IsString()
  @IsOptional()
  linkUrl?: string;
}
