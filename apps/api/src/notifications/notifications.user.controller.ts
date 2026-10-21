import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { NotificationsService } from './notifications.service.js';
import {
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
} from './dto/index.js';

@ApiTags('User Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsUserController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @ApiOperation({
    summary: 'Retrieve paginated notifications for the authenticated user',
  })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedNotificationsResponseDto })
  async getMyNotifications(
    @CurrentUser() user: AccessPayload,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedNotificationsResponseDto> {
    return this.notificationsService.getUserNotifications(
      user.sub,
      unreadOnly === 'true',
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Counter object with unreadCount' })
  async getUnreadCount(@CurrentUser() user: AccessPayload) {
    return this.notificationsService.getUserUnreadCount(user.sub);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all of current user notifications as read' })
  @ApiResponse({ status: 200, description: 'All marked as read successfully' })
  async markAllRead(@CurrentUser() user: AccessPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an individual notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(
    @CurrentUser() user: AccessPayload,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, user.sub);
  }
}
