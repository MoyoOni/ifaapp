import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '../modules/user/user.module';
import { AuditService } from './services/audit.service';
import { ImpersonationService } from './services/impersonation.service';
import { SesEmailService } from './services/ses-email.service';
import { PiiMaskingUtil } from './utils/pii-masking.util';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { JwtAuthGuard } from './guards/auth.guard';
import { CrisisDetectionService } from './services/crisis-detection.service';
import { ContentFlagMatcherService } from './services/content-flag-matcher.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule, UserModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    UserModule,
  ],
  providers: [
    Reflector,
    AuditService,
    ImpersonationService,
    PiiMaskingUtil,
    AuditInterceptor,
    JwtAuthGuard,
    SesEmailService,
    CrisisDetectionService,
    ContentFlagMatcherService,
  ],
  exports: [
    Reflector,
    AuditService,
    ImpersonationService,
    PiiMaskingUtil,
    AuditInterceptor,
    JwtModule,
    JwtAuthGuard,
    SesEmailService,
    CrisisDetectionService,
    ContentFlagMatcherService,
  ],
})
export class SharedModule {}
