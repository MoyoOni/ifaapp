import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { QuickAccessDto } from './dto/quick-access.dto';

// DTO for impersonation request
class ImpersonateUserDto {
  declare userId: string;
  declare reason: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /** 10 requests per minute (HC-204.3) to mitigate brute-force */
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('impersonate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVISORY_BOARD_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate user impersonation (admin only)' })
  @ApiResponse({ status: 200, description: 'Successfully initiated impersonation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async impersonate(
    @CurrentUser() adminUser: any,
    @Body() impersonateDto: ImpersonateUserDto,
  ) {
    this.logger.log(`Admin ${adminUser.id} initiating impersonation of user ${impersonateDto.userId}`);

    return this.authService.initiateImpersonation(
      adminUser,
      impersonateDto.userId,
      impersonateDto.reason,
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
}
