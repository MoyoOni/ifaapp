import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import sgMail from '@sendgrid/mail';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
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
    private readonly impersonationService: ImpersonationService
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

    // Generate email verification token (one-use UUID)
    const emailVerificationToken = randomUUID();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        phone: dto.phone ?? null,
        yorubaName: dto.yorubaName,
        culturalLevel: dto.culturalLevel || 'Omo Ilé',
        emailVerificationToken,
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

    // Send email verification (fire-and-forget; never blocks registration)
    this.sendVerificationEmail(user.email, user.name, emailVerificationToken).catch((err) => {
      this.logger.error(`Failed to send verification email to ${user.email}`, err);
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

  async validateUser(emailOrPhone: string, password: string): Promise<any> {
    // Support Nigerian phone numbers: if input looks like a phone number, look up by phone
    const isPhone = /^[+]?[0-9]{10,14}$/.test(emailOrPhone.replace(/\s/g, ''));
    const user = isPhone
      ? await this.prisma.user.findUnique({ where: { phone: emailOrPhone } })
      : await this.prisma.user.findUnique({ where: { email: emailOrPhone } });

    if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
      // Exclude password hash from returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async findOrCreateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    // Find existing user by Google ID or email
    let user = await this.prisma.user.findUnique({ where: { googleId: googleProfile.googleId } });
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: googleProfile.email } });
    }

    if (user) {
      // Link Google ID if not already set
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleProfile.googleId, avatar: user.avatar || googleProfile.avatar },
        });
      }
    } else {
      // Create new user via Google signup (defaults to CLIENT role, onboarding will ask role)
      user = await this.prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          passwordHash: '', // Google users have no password
          role: UserRole.CLIENT,
          googleId: googleProfile.googleId,
          avatar: googleProfile.avatar,
          culturalLevel: 'Omo Ilé',
        },
      });

      // Send welcome message for new Google users
      this.sendWelcomeMessage(user.id).catch((err) => {
        this.logger.error(`Failed to send welcome message to ${user!.id}`, err);
      });
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

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password); // dto.email accepts email or phone
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
   * Verify Google ID token from @react-oauth/google frontend library.
   * Finds or creates a user and returns our JWT tokens.
   */
  async verifyGoogleToken(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    let payload: any;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email) {
      throw new UnauthorizedException('Google token missing email');
    }

    return this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
    });
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
    reason: string
  ): Promise<{ token: string }> {
    const impersonationResult = await this.impersonationService.initiateImpersonation(
      adminUser,
      targetUserId,
      reason
    );

    return {
      token: impersonationResult.token,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null, // one-use: clear after verification
      },
    });

    this.logger.log(`Email verified for user ${user.id}`);
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  private async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@ilu-ase.com';

    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
      await sgMail.send({
        to: email,
        from: fromEmail,
        subject: 'Verify your email — Ilé Àṣẹ',
        html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>Thank you for joining Ilé Àṣẹ. Please verify your email address to complete your registration.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Verify Email Address
      </a>
    </div>
    <p style="font-size:14px;color:#6B7280;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    <p style="font-size:12px;color:#9CA3AF;">Or copy this link: ${verifyUrl}</p>
  </div>
</body></html>`,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } else {
      // Development fallback: log the URL so it can be used without SMTP configured
      this.logger.log(`[DEV] Email verification URL for ${email}: ${verifyUrl}`);
    }
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
