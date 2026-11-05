import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagingService } from './messaging.service.js';
import { ModerationFilterService } from './moderation-filter.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import {
  CreateConversationDto,
  QueryMessagesDto,
  ReportConversationDto,
  SendMessageDto,
} from './dto/messaging.dto.js';

@ApiTags('Messaging')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly moderationFilter: ModerationFilterService,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Initiate or retrieve conversation thread with a freelancer (active members only)' })
  createConversation(
    @CurrentUser() user: AccessPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagingService.getOrCreateConversation(user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversation threads with unread counts' })
  listConversations(@CurrentUser() user: AccessPayload) {
    return this.messagingService.listUserConversations(user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  getMessages(
    @CurrentUser() user: AccessPayload,
    @Param('id') conversationId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.messagingService.getMessages(user.sub, conversationId, query);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation thread' })
  sendMessage(
    @CurrentUser() user: AccessPayload,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.sub, conversationId, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark incoming messages in a conversation as read' })
  markAsRead(
    @CurrentUser() user: AccessPayload,
    @Param('id') conversationId: string,
  ) {
    return this.messagingService.markAsRead(user.sub, conversationId);
  }

  @Post('conversations/:id/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report abusive conversation thread for admin review' })
  reportConversation(
    @CurrentUser() user: AccessPayload,
    @Param('id') conversationId: string,
    @Body() dto: ReportConversationDto,
  ) {
    return this.moderationFilter.reportConversation(
      user.sub,
      conversationId,
      dto.reason,
      dto.messageId,
    );
  }

  @Post('users/:id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user from sending messages' })
  blockUser(
    @CurrentUser() user: AccessPayload,
    @Param('id') targetUserId: string,
  ) {
    return this.moderationFilter.blockUser(user.sub, targetUserId);
  }

  @Delete('users/:id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a user' })
  unblockUser(
    @CurrentUser() user: AccessPayload,
    @Param('id') targetUserId: string,
  ) {
    return this.moderationFilter.unblockUser(user.sub, targetUserId);
  }
}

