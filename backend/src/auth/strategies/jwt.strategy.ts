import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@ile-ase/common';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  verified: boolean;
  isImpersonated?: boolean;
  impersonatorId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      // CurrentUserPayload declares `sub` as a required field (and several
      // ownership checks — UsersController.findOne/update, ClientSessionNotesService —
      // read currentUser.sub, not currentUser.id) but this never set it, so
      // `sub` was always undefined and every one of those self-access checks
      // always failed for non-admins. This was a real, silent authorization bug.
      sub: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      adminSubRole: user.adminSubRole ?? undefined,
      isImpersonated: payload.isImpersonated || false,
      impersonatorId: payload.impersonatorId,
    };
  }
}
