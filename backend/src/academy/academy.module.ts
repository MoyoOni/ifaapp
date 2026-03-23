import { Module } from '@nestjs/common';
import { AcademyController } from './academy.controller';
import { AcademyService } from './academy.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CertificateModule } from '../certificates/certificate.module';
import { UsersModule } from '../users/users.module';

/**
 * Academy Module
 * Course management, enrollment, progress tracking, and certificate generation
 */
@Module({
  imports: [PrismaModule, AuthModule, CertificateModule, UsersModule],
  controllers: [AcademyController],
  providers: [AcademyService],
  exports: [AcademyService],
})
export class AcademyModule {}
