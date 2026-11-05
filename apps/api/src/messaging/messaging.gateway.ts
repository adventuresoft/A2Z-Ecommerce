import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(private readonly tokenService: TokenService) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, ''));

      if (!rawToken) {
        this.logger.debug(`Socket ${client.id} missing auth token, disconnecting`);
        client.disconnect(true);
        return;
      }

      const payload = await this.tokenService.verifyAccessToken(rawToken);
      client.data.userId = payload.sub;
      client.data.user = payload;

      const userRoom = `user:${payload.sub}`;
      await client.join(userRoom);
      this.logger.debug(`Socket ${client.id} authenticated as ${payload.sub} and joined ${userRoom}`);
    } catch (err: any) {
      this.logger.debug(`Socket ${client.id} authentication failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  /**
   * Check if a specific user is currently connected to their private room.
   */
  isUserOnline(userId: string): boolean {
    if (!this.server) return false;
    const room = (this.server as any).sockets?.adapter?.rooms?.get(`user:${userId}`);
    return !!room && room.size > 0;
  }

  /**
   * Emit an event to all connected sockets belonging to a specific user.
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Ephemeral typing indicator forwarder.
   */
  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; recipientUserId: string; isTyping: boolean },
  ) {
    if (!client.data.userId || !payload.recipientUserId) return;
    this.emitToUser(payload.recipientUserId, 'message:typing', {
      conversationId: payload.conversationId,
      senderId: client.data.userId,
      isTyping: payload.isTyping,
    });
  }
}
