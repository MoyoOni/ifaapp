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
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
      const allowedOrigins = allowed.split(',').map((o) => o.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  declare server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        this.logger.error('JWT_SECRET is not configured. Rejecting WebSocket connection.');
        throw new UnauthorizedException('Server misconfigured');
      }

      const payload = this.jwtService.verify(token, {
        secret: jwtSecret,
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

  @UseGuards(WsJwtGuard)
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
