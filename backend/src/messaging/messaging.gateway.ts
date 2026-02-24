import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  declare server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Validate Token
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
      });

      // Attach user to socket
      client.data.user = payload;

      // Join user specific room
      const userId = payload.sub;
      await client.join(`user_${userId}`);

      this.logger.log(`Client connected: ${userId}`);
    } catch (e) {
      this.logger.warn('Connection unauthorized:', (e as Error).message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto
  ) {
    const user = client.data.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Call service to persist message
    const message = await this.messagingService.sendMessage(user.sub, payload, {
      id: user.sub,
      sub: user.sub,
      email: user.email,
      role: user.role,
      verified: user.verified || false,
    });

    // Emit to receiver's room
    this.server.to(`user_${payload.receiverId}`).emit('new_message', message);

    // Also emit back to sender (for confirmation/multi-device sync)
    // Note: The service returns the message with decrypted content for the sender
    client.emit('message_sent', message);

    return message;
  }

  private extractToken(client: Socket): string | undefined {
    // Check auth header or query param
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    const { token } = client.handshake.query;
    return token as string;
  }
}
