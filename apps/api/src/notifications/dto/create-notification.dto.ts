import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Target Recipient User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Notification category type',
    enum: NotificationType,
    example: NotificationType.ORDER_STATUS,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    description: 'Notification headline / title',
    example: 'Your order #AZ-2026-N491L0 has been shipped',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Notification message body',
    example: 'Your package is now in transit with Steadfast courier.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'In-app navigation destination or external tracking link',
    example: '/orders/AZ-2026-N491L0',
  })
  @IsString()
  @IsOptional()
  linkUrl?: string;
}
