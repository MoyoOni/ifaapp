import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import { TOKEN_DENYLIST_PREFIX } from './token-denylist.constants';
import { MessagingService } from '../messaging/messaging.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, issuedBeforePasswordChange } from './strategies/jwt.strategy';
import { UserRole } from '@common/enums/user-role.enum';
import { UserService } from '../modules/user/user.service';
import { ImpersonationService } from '../shared/services/impersonation.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { generateSlug } from '../users/slug.util';

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
    private readonly sesEmailService: SesEmailService,
    private readonly redisCache: RedisCacheService
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

    // Prevent self-registration as ADMIN or VENDOR — those roles are assigned by existing admins
    const safeRole = dto.role === UserRole.ADMIN ? UserRole.CLIENT : dto.role;

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: safeRole,
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

    // Auto-assign slug from name (unique personal URL)
    const baseSlug = generateSlug(user.name);
    let slug = baseSlug;
    const slugConflict = await this.prisma.user.findUnique({ where: { slug } });
    if (slugConflict) {
      slug = generateSlug(user.name, Date.now().toString(36).slice(-4));
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { slug } });

    // Generate unique referral code: firstname-6chars e.g. 'adewale-3k9xp2'.
    // A collision on the random suffix is vanishingly rare but was previously
    // unhandled -- it would throw on the update above (unique constraint)
    // *after* the user row already existed, failing the whole registration
    // request. Retried independently of the slug write so a collision here
    // can never take registration down with it.
    const firstName = user.name
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    await this.assignReferralCode(user.id, firstName);

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

    // Link referral if a valid referral code was provided
    if (dto.referredByCode) {
      this.linkReferral(user.id, dto.referredByCode).catch((err) => {
        this.logger.warn(`Referral link failed for code ${dto.referredByCode}`, err);
      });
    }

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
        adminSubRole: (user as any).adminSubRole ?? undefined,
      },
      ...tokens,
    };
  }

  private async assignReferralCode(userId: string, firstName: string): Promise<string | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 8);
      const referralCode = `${firstName}-${suffix}`;
      try {
        await this.prisma.user.update({ where: { id: userId }, data: { referralCode } });
        return referralCode;
      } catch (err) {
        this.logger.warn(
          `Referral code collision on attempt ${attempt + 1} for user ${userId} (code=${referralCode})`
        );
      }
    }
    this.logger.error(`Failed to assign a unique referral code for user ${userId} after 3 attempts`);
    return null;
  }

  private async linkReferral(newUserId: string, referralCode: string) {
    const referrer = await this.prisma.user.findUnique({ where: { referralCode } });
    if (!referrer || referrer.id === newUserId) return; // invalid or self-referral
    await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        code: referralCode,
        rewardGranted: false,
      },
    });
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

      // Auto-assign slug from name
      const baseSlug = generateSlug(user.name);
      let slug = baseSlug;
      const slugConflict = await this.prisma.user.findUnique({ where: { slug } });
      if (slugConflict) {
        slug = generateSlug(user.name, Date.now().toString(36).slice(-4));
      }
      await this.prisma.user.update({ where: { id: user.id }, data: { slug } });

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
        adminSubRole: (user as any).adminSubRole ?? undefined,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto, req?: Request) {
    const ip = req
      ? ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        req.socket?.remoteAddress)
      : undefined;
    const ua = req?.headers['user-agent'];

    const user = await this.validateUser(dto.email, dto.password); // dto.email accepts email or phone
    if (!user) {
      // Log failed attempt
      this.logSessionSilently({
        userId: null,
        email: dto.email,
        ip,
        ua,
        success: false,
        failReason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      verified: user.verified,
    });

    // Log successful session
    this.logSessionSilently({ userId: user.id, email: user.email, ip, ua, success: true });

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
        adminSubRole: (user as any).adminSubRole ?? undefined,
      },
      ...tokens,
    };
  }

  private logSessionSilently(opts: {
    userId: string | null;
    email: string;
    ip?: string;
    ua?: string;
    success: boolean;
    failReason?: string;
  }) {
    if (!opts.userId) return; // Only log sessions for known users
    this.prisma.userSession
      .create({
        data: {
          userId: opts.userId,
          ipAddress: opts.ip ?? null,
          userAgent: opts.ua ?? null,
          success: opts.success,
          failReason: opts.failReason ?? null,
        },
      })
      .catch((err: Error) => this.logger.warn(`Session log failed: ${err.message}`));
  }

  /**
   * Verify Google ID token from @react-oauth/google frontend library.
   * Finds or creates a user and returns our JWT tokens.
   */
  async verifyGoogleToken(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    // Without this, `new OAuth2Client(undefined)` + `audience: undefined`
    // doesn't fail closed the way you'd want -- it either throws a generic,
    // hard-to-diagnose "Invalid Google token" for every request, or (worse)
    // verifies a token without actually restricting it to this app's
    // audience. Fail loud and specific instead, matching the
    // Paystack/Flutterwave config-guard pattern elsewhere in this file.
    if (!clientId) {
      this.logger.error('GOOGLE_CLIENT_ID is not configured — refusing to verify Google sign-in');
      throw new UnauthorizedException('Google sign-in is not configured');
    }
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
        adminSubRole: (user as any).adminSubRole ?? undefined,
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

      if (
        payload.jti &&
        (await this.redisCache.exists(`${TOKEN_DENYLIST_PREFIX}${payload.jti}`))
      ) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (issuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
        throw new UnauthorizedException('Session ended because the password was changed');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role as any,
        verified: user.verified,
      });

      // Rotate: the refresh token just spent can't be replayed even though
      // it hasn't naturally expired yet.
      if (payload.jti) {
        await this.logout(payload.jti, payload.exp);
      }

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

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
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
</body></html>`;

    await this.sesEmailService.sendEmail(email, 'Verify your email — Ilé Àṣẹ', html);
    this.logger.log(`Verification email sent to ${email}`);
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

    // Shared jti ties the access/refresh pair together as one "session" so
    // logout() (and refresh-token rotation, below) can revoke both at once
    // via a single denylist entry — see TOKEN_DENYLIST_PREFIX.
    const sessionPayload = { ...payload, jti: randomUUID() };

    const accessToken = this.jwtService.sign(sessionPayload, {
      secret: jwtSecret,
      // `as any`: @nestjs/jwt's `expiresIn` type wants a `StringValue` template
      // literal from `ms`, not `string` — matches the existing cast in
      // auth.module.ts's JwtModule.registerAsync default signOptions.
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(sessionPayload, {
      secret: jwtRefreshSecret,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Revokes the current session's token pair (both access and refresh share
   * one jti). `exp` is the token's own expiry claim — the denylist entry's
   * TTL is capped to it so revoked entries don't outlive the token they
   * block and don't accumulate in Redis forever.
   */
  async logout(jti: string, exp?: number): Promise<{ message: string }> {
    const ttlSeconds = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 1) : 7 * 24 * 60 * 60;
    await this.redisCache.set(`${TOKEN_DENYLIST_PREFIX}${jti}`, '1', ttlSeconds);
    return { message: 'Logged out successfully' };
  }

  /**
   * Revokes the session behind whichever token(s) the caller presents, by
   * verifying each signature itself (this runs without JwtAuthGuard so it
   * still works once the short-lived access token has expired). Access and
   * refresh tokens share one jti, so a valid refresh token alone revokes both.
   * Idempotent -- a token that fails verification (forged, malformed, already
   * expired) has nothing left to revoke and is ignored rather than rejected.
   */
  async revokeSession(tokens: { accessToken?: string; refreshToken?: string }): Promise<{ message: string }> {
    const candidates = [
      { token: tokens.refreshToken, secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
      { token: tokens.accessToken, secret: this.configService.get<string>('JWT_SECRET') },
    ];
    const revoked = new Set<string>();
    for (const { token, secret } of candidates) {
      if (!token || !secret) continue;
      try {
        const payload = this.jwtService.verify<JwtPayload>(token, { secret });
        if (payload.jti && !revoked.has(payload.jti)) {
          revoked.add(payload.jti);
          await this.logout(payload.jti, payload.exp);
        }
      } catch {
        // nothing to revoke for an unverifiable or expired token
      }
    }
    return { message: 'Logged out successfully' };
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    // Only for Google-only accounts (passwordHash ''). This used to overwrite
    // an existing password too -- anyone holding a member's access token could
    // replace their password without knowing it. Changing one goes through
    // changePassword, which requires the current password.
    if (user.passwordHash) {
      throw new BadRequestException('This account already has a password. Use change password instead.');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  // ==================== Forgot / reset / change password ====================
  // There was no way to do any of these: the login page's "Forgot password?"
  // button had no handler and Settings' "Change Password" just opened the
  // profile page, so a member who forgot their password was locked out.

  static readonly RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

  private static hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Always returns the same response, whether or not the email has an
   * account, so this can't be used to find out who is registered.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const message = 'If an account exists for that email, a password reset link is on its way.';
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message };

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    await this.prisma.$transaction([
      // A new link supersedes any earlier ones.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: AuthService.hashResetToken(token),
          expiresAt: new Date(now.getTime() + AuthService.RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    try {
      await this.sendPasswordResetEmail(user.email, user.yorubaName || user.name, token);
    } catch (error) {
      // Still the same response to the caller; the failure is ours to see.
      this.logger.error(`Failed to send password reset email for user ${user.id}`, error as Error);
    }
    return { message };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const invalid = new BadRequestException('This reset link is invalid or has expired. Please request a new one.');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: AuthService.hashResetToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw invalid;

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      // Conditional claim so the same link can't be used twice concurrently.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw invalid;
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
    });

    this.logger.log(`Password reset for user ${record.userId}`);
    return { message: 'Your password has been reset. You can now sign in.' };
  }

  /**
   * Requires the current password. Ends every other session (via
   * passwordChangedAt) and returns a fresh token pair so this one stays
   * signed in.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('This account has no password yet. Use set password instead.');
    }
    // 400, not 401: a 401 would make the client treat the session as expired.
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Your current password is incorrect.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('Choose a new password that is different from your current one.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() },
    });

    this.logger.log(`Password changed for user ${userId}`);
    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      verified: user.verified,
    });
  }

  // ==================== Change email ====================
  // Settings' "Update Email" used to just open the profile page; there was no
  // way to change an account's email at all.

  static readonly EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;

  /**
   * Requires the current password, then emails a confirmation link to the NEW
   * address. Nothing changes until that link is used, so a typo or someone
   * else's address can't take the account somewhere it can't come back from.
   */
  async requestEmailChange(userId: string, newEmailRaw: string, currentPassword: string): Promise<{ message: string }> {
    const newEmail = newEmailRaw.trim();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('Set a password for your account first, then you can change your email.');
    }
    // 400, not 401: a 401 would make the client treat the session as expired.
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Your current password is incorrect.');
    }
    if (newEmail === user.email) {
      throw new BadRequestException('That is already your email address.');
    }
    if (await this.prisma.user.findUnique({ where: { email: newEmail } })) {
      throw new ConflictException('That email address is already in use by another account.');
    }

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.emailChangeToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
      this.prisma.emailChangeToken.create({
        data: {
          userId,
          newEmail,
          tokenHash: AuthService.hashResetToken(token),
          expiresAt: new Date(now.getTime() + AuthService.EMAIL_CHANGE_TTL_MS),
        },
      }),
    ]);

    await this.sendEmailChangeConfirmation(newEmail, user.yorubaName || user.name, token);
    return { message: `We sent a confirmation link to ${newEmail}. Your email will change once you open it.` };
  }

  async confirmEmailChange(token: string): Promise<{ message: string; email: string }> {
    const invalid = new BadRequestException('This confirmation link is invalid or has expired. Please request the change again.');
    const record = await this.prisma.emailChangeToken.findUnique({
      where: { tokenHash: AuthService.hashResetToken(token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw invalid;

    // Re-check: the address may have been registered since the request.
    if (await this.prisma.user.findUnique({ where: { email: record.newEmail } })) {
      throw new ConflictException('That email address is already in use by another account.');
    }

    const oldEmail = record.user.email;
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.emailChangeToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw invalid;
      // The link proved control of the new address, so it's verified.
      await tx.user.update({
        where: { id: record.userId },
        data: { email: record.newEmail, emailVerifiedAt: new Date() },
      });
    });

    this.logger.log(`Email changed for user ${record.userId}`);
    try {
      await this.sendEmailChangedNotice(oldEmail, record.user.yorubaName || record.user.name, record.newEmail);
    } catch (error) {
      this.logger.error(`Failed to notify old address of email change for user ${record.userId}`, error as Error);
    }
    return { message: 'Your email address has been updated.', email: record.newEmail };
  }

  private async sendEmailChangeConfirmation(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const confirmUrl = `${frontendUrl}/confirm-email-change?token=${token}`;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>Confirm that you'd like to use this address for your Ilé Àṣẹ account.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Confirm New Email
      </a>
    </div>
    <p style="font-size:14px;color:#6B7280;">This link expires in 24 hours. If you didn't ask for this, you can ignore this email — nothing will change.</p>
    <p style="font-size:12px;color:#9CA3AF;">Or copy this link: ${confirmUrl}</p>
  </div>
</body></html>`;
    await this.sesEmailService.sendEmail(email, 'Confirm your new email — Ilé Àṣẹ', html);
  }

  private async sendEmailChangedNotice(oldEmail: string, name: string, newEmail: string): Promise<void> {
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>The email address on your Ilé Àṣẹ account was just changed to <strong>${newEmail}</strong>. You'll sign in with that address from now on.</p>
    <p style="font-size:14px;color:#6B7280;">If you didn't make this change, please contact support right away.</p>
  </div>
</body></html>`;
    await this.sesEmailService.sendEmail(oldEmail, 'Your email address was changed — Ilé Àṣẹ', html);
  }

  private async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:#FDFCF0;margin:0;font-size:28px;">Ilé Àṣẹ</h1>
  </div>
  <div style="background:#FDFCF0;padding:30px;border-radius:0 0 10px 10px;border:1px solid #E5E7EB;">
    <p>Àṣẹ ${name},</p>
    <p>We received a request to reset your password. Choose a new one using the button below.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#B45309;color:#FFFFFF;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;">
        Reset Password
      </a>
    </div>
    <p style="font-size:14px;color:#6B7280;">This link expires in 1 hour and can only be used once. If you didn't ask for this, you can ignore this email — your password won't change.</p>
    <p style="font-size:12px;color:#9CA3AF;">Or copy this link: ${resetUrl}</p>
  </div>
</body></html>`;

    await this.sesEmailService.sendEmail(email, 'Reset your password — Ilé Àṣẹ', html);
    this.logger.log(`Password reset email sent to user ${email}`);
  }
}
