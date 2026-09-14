import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { UserRole } from '@ile-ase/common';
import { TOKEN_DENYLIST_PREFIX } from '../token-denylist.constants';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  verified: boolean;
  isImpersonated?: boolean;
  impersonatorId?: string;
  jti?: string; // unique per token pair, used for logout/revocation
  exp?: number; // standard JWT claim, populated by passport-jwt at verify time
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisCache: RedisCacheService
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
    // Revoked on logout (see AuthService.logout) — a stateless JWT is otherwise
    // valid until natural expiry with no way to invalidate it early.
    if (payload.jti && (await this.redisCache.exists(`${TOKEN_DENYLIST_PREFIX}${payload.jti}`))) {
      throw new UnauthorizedException('Token has been revoked');
    }

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
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
