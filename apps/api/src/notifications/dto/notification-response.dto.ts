import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, Role } from '@prisma/client';

export class NotificationUserSnapshotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Admin User' })
  name: string;

  @ApiProperty({ example: 'admin@az-ecommerce.local' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role: Role;
}

export class NotificationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174099' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.LOW_STOCK })
  type: NotificationType;

  @ApiProperty({ example: 'Low Stock Alert: SKU-WL-HEADPHONE-BLK' })
  title: string;

  @ApiProperty({ example: 'Product stock is 2 units remaining, below the threshold of 5.' })
  message: string;

  @ApiPropertyOptional({ example: '/inventory/low-stock' })
  linkUrl?: string | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2026-10-21T14:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ type: () => NotificationUserSnapshotDto })
  user?: NotificationUserSnapshotDto;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 15 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
