import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RequirePermission } from '../auth/decorators/require-permission.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { NotificationsService } from './notifications.service.js';
import {
  BroadcastNotificationDto,
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationStatsResponseDto,
  PaginatedNotificationsResponseDto,
  QueryNotificationsDto,
} from './dto/index.js';

@ApiTags('Admin Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SHOP_MANAGER)
@Controller('admin/notifications')
export class NotificationsAdminController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('stats')
  @RequirePermission('engagement', 'read')
  @ApiOperation({
    summary: 'Retrieve operational notification metrics and distribution breakdown',
  })
  @ApiResponse({ status: 200, type: NotificationStatsResponseDto })
  async getStats(): Promise<NotificationStatsResponseDto> {
    return this.notificationsService.getNotificationStats();
  }

  @Get()
  @RequirePermission('engagement', 'read')
  @ApiOperation({
    summary: 'Administrative paginated list of notifications with search and filters',
  })
  @ApiResponse({ status: 200, type: PaginatedNotificationsResponseDto })
  async getNotifications(
    @Query() query: QueryNotificationsDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    return this.notificationsService.getAdminNotifications(query);
  }

  @Post('broadcast')
  @RequirePermission('engagement', 'create')
  @ApiOperation({
    summary: 'Broadcast a promotional or system notification to targeted roles or all active users',
  })
  @ApiResponse({ status: 201, description: 'Broadcast dispatched successfully' })
  async broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcastNotification(dto);
  }

  @Post()
  @RequirePermission('engagement', 'create')
  @ApiOperation({
    summary: 'Dispatch a direct alert or notification to a specific user',
  })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  async createNotification(
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(dto);
  }

  @Patch('mark-all-read')
  @RequirePermission('engagement', 'update')
  @ApiOperation({
    summary: 'Mark all unread notifications as read for current administrator',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllRead(@CurrentUser() user: AccessPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  @RequirePermission('engagement', 'update')
  @ApiOperation({ summary: 'Mark an individual notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @RequirePermission('engagement', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a notification record' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
