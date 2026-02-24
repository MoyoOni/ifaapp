import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    // User should have been attached during handleConnection
    const user = client.data.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return true;
  }
}
