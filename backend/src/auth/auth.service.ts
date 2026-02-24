import { Injectable, UnauthorizedException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '@common/enums/user-role.enum';
import { UserService } from '../modules/user/user.service';
import { ImpersonationService } from '../shared/services/impersonation.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagingService: MessagingService,
    private readonly userService: UserService,
    private readonly impersonationService: ImpersonationService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        yorubaName: dto.yorubaName,
        culturalLevel: dto.culturalLevel || 'Omo Ilé',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        yorubaName: true,
        culturalLevel: true,
        hasOnboarded: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      verified: user.verified,
    });

    // Send Welcome Message from Chief Adeyemi (Admin)
    if (user.role === UserRole.CLIENT) {
      this.sendWelcomeMessage(user.id).catch((err) => {
        this.logger.error(`Failed to send welcome message to ${user.id}`, err);
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        yorubaName: user.yorubaName,
        culturalLevel: user.culturalLevel,
        hasOnboarded: user.hasOnboarded,
      },
      ...tokens,
    };
  }

  private async sendWelcomeMessage(userId: string) {
    // Find an Admin to be the sender (Chief Adeyemi equivalent)
    // We prioritize an admin with the specific email, or fallback to any admin
    let admin = await this.prisma.user.findUnique({
      where: { email: 'admin@ile-ase.test' },
    });

    if (!admin) {
      // Fallback to any admin
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        take: 1,
      });
      if (admins.length > 0) admin = admins[0];
    }

    if (admin) {
      const welcomeText = `E kàábọ̀ (Welcome) to Ilé Àṣẹ.

I am Chief Adeyemi, and I am honored to welcome you to our digital village. Here, technology serves tradition, not the other way around.

As you begin your journey, remember that patience (Sùúrù) is the father of good character (Ìwà).

If you need guidance navigating our village or finding a verified Babaláwo, do not hesitate to reach out.

May your path be clear.
Aboru Aboye.`;

      await this.messagingService.sendSystemMessage(admin.id, userId, welcomeText);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      // Exclude password hash from returned user object
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      verified: user.verified,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        yorubaName: user.yorubaName,
        culturalLevel: user.culturalLevel,
        hasOnboarded: user.hasOnboarded,
      },
      ...tokens,
    };
  }

  /**
   * Quick Access Login - Development/Demo Mode
   * Bypasses password authentication for quick testing
   */
  async quickAccessLogin(email: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(`User not found: ${email}. Please seed the database first.`);
    }

    // Generate tokens without password verification
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      verified: user.verified,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        yorubaName: user.yorubaName,
        culturalLevel: user.culturalLevel,
        hasOnboarded: user.hasOnboarded,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
      }
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: jwtRefreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role as any,
        verified: user.verified,
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async initiateImpersonation(
    adminUser: any,
    targetUserId: string,
    reason: string,
  ): Promise<{ token: string }> {
    const impersonationResult = await this.impersonationService.initiateImpersonation(
      adminUser,
      targetUserId,
      reason,
    );

    return {
      token: impersonationResult.token,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '1h', // Longer for impersonation sessions
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
