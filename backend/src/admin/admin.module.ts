import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { InactivePractitionerMonitorService } from './inactive-practitioner-monitor.service';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminAcademyService } from './admin-academy.service';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { AdminPlatformSettingsService } from './admin-platform-settings.service';
import { GdprModule } from '../gdpr/gdpr.module';

@Module({
  imports: [GdprModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AuditService,
    InactivePractitionerMonitorService,
    AdminMarketplaceService,
    AdminAcademyService,
    AdminTrustScoreService,
    AdminPlatformSettingsService,
  ],
  exports: [AdminService, InactivePractitionerMonitorService],
})
export class AdminModule {}
