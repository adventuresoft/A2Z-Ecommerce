import { ApiProperty } from '@nestjs/swagger';

export class NotificationTypeCountsDto {
  @ApiProperty({ example: 12 })
  orderStatus: number;

  @ApiProperty({ example: 8 })
  payment: number;

  @ApiProperty({ example: 5 })
  lowStock: number;

  @ApiProperty({ example: 15 })
  promotion: number;

  @ApiProperty({ example: 5 })
  system: number;
}

export class NotificationStatsResponseDto {
  @ApiProperty({ example: 45 })
  totalCount: number;

  @ApiProperty({ example: 18 })
  unreadCount: number;

  @ApiProperty({ example: 27 })
  readCount: number;

  @ApiProperty({ type: NotificationTypeCountsDto })
  byType: NotificationTypeCountsDto;
}
