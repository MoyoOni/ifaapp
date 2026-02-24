import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditService } from './services/audit.service';
import { ImpersonationService } from './services/impersonation.service';
import { PiiMaskingUtil } from './utils/pii-masking.util';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { JwtAuthGuard } from './guards/auth.guard';
import { AdminSubRolesGuard } from './guards/admin-sub-roles.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [
    AuditService,
    ImpersonationService,
    PiiMaskingUtil,
    AuditInterceptor,
    JwtAuthGuard,
    AdminSubRolesGuard,
  ],
  exports: [
    AuditService,
    ImpersonationService,
    PiiMaskingUtil,
    AuditInterceptor,
    JwtModule,
    JwtAuthGuard,
    AdminSubRolesGuard,
  ],
})
export class SharedModule {}