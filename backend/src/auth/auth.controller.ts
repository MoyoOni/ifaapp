import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '@/auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { QuickAccessDto } from './dto/quick-access.dto';

// DTO for impersonation request
class ImpersonateUserDto {
  declare userId: string;
  declare reason: string;
}

// DTO for Google token verification (SPA flow)
class GoogleTokenDto {
  @IsString()
  declare credential: string; // Google ID token from @react-oauth/google
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * 10 requests per minute (HC-204.3) to mitigate brute-force — enforced by
   * the module-level 'auth' named throttler (throttler.config.ts), which
   * already defaults to exactly 10/60s and is the one actually tunable via
   * THROTTLE_AUTH_LIMIT/THROTTLE_AUTH_TTL. No per-route @Throttle() here
   * deliberately — a route-level @Throttle({ default: {...} }) used to sit
   * on this route with a *literal* limit of 10, which is a hardcoded
   * override that no env var can ever move, regardless of which named
   * throttler key it targets. That silently defeated CI's
   * THROTTLE_AUTH_LIMIT=1000 override (see ci-cd.yml's P1-03 comment, which
   * assumed raising that env var would give integration tests headroom —
   * it couldn't, no matter which bucket name the decorator used), causing
   * real, intermittent 429s in integration tests since whenever that
   * decorator was added. Relying purely on the module config instead means
   * production keeps the same 10/60s limit, but CI's env override now
   * actually works.
   */
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** 10 requests per minute to mitigate brute-force, via the module-level 'auth' throttler (see note above) */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  /**
   * Google OAuth — verify Google ID token from frontend SPA and return JWT
   * Frontend sends the credential token from @react-oauth/google useGoogleLogin
   */
  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in / sign up with Google ID token' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with Google' })
  async googleToken(@Body(ValidationPipe) body: GoogleTokenDto) {
    if (!body.credential) {
      throw new BadRequestException('Google credential token is required');
    }
    return this.authService.verifyGoogleToken(body.credential);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and revoke the current session' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: { jti?: string; exp?: number }) {
    if (!user.jti) {
      // Tokens issued before this feature shipped have no jti to revoke —
      // they'll simply expire naturally rather than being invalidated early.
      return { message: 'Logged out successfully' };
    }
    return this.authService.logout(user.jti, user.exp);
  }

  @Post('impersonate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SUPER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate user impersonation (admin only)' })
  @ApiResponse({ status: 200, description: 'Successfully initiated impersonation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async impersonate(@CurrentUser() adminUser: any, @Body() impersonateDto: ImpersonateUserDto) {
    this.logger.log(
      `Admin ${adminUser.id} initiating impersonation of user ${impersonateDto.userId}`
    );

    return this.authService.initiateImpersonation(
      adminUser,
      impersonateDto.userId,
      impersonateDto.reason
    );
  }

  @Post('end-impersonation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End current impersonation session' })
  @ApiResponse({ status: 200, description: 'Successfully ended impersonation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async endImpersonation(@CurrentUser() user: any) {
    if (!user.isImpersonated) {
      return { message: 'Not currently impersonating any user' };
    }

    this.logger.log(`User ${user.id} ending impersonation session (was impersonating)`);

    return { message: 'Impersonation ended successfully' };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address via token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Missing token' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Quick Access - Demo/Dev mode
   * Bypasses password for development and demo purposes
   * Only enabled when explicitly set and not in production
   */
  @ApiOperation({
    summary: 'Quick login (DEV/DEMO ONLY)',
    description: 'Bypasses password for rapid testing',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Quick access disabled' })
  @Post('quick-access')
  @HttpCode(HttpStatus.OK)
  async quickAccess(@Body() dto: QuickAccessDto) {
    // Explicitly disabled in production
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Quick access is disabled in production');
    }

    // Require explicit opt-in for quick access
    if (process.env.ENABLE_QUICK_ACCESS !== 'true') {
      throw new UnauthorizedException(
        'Quick access is disabled. Set ENABLE_QUICK_ACCESS=true in .env to enable (development only)'
      );
    }

    return this.authService.quickAccessLogin(dto.email);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setPassword(@CurrentUser() currentUser: { id: string }, @Body() body: SetPasswordDto) {
    return this.authService.setPassword(currentUser.id, body.password);
  }
}
