import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditService } from './audit.service';
import { InactivePractitionerMonitorService } from './inactive-practitioner-monitor.service';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { AdminAcademyService } from './admin-academy.service';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { AdminPlatformSettingsService } from './admin-platform-settings.service';
import { AdminUsersService } from './admin-users.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminCommunityService } from './admin-community.service';
import { AdminContentService } from './admin-content.service';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { GdprModule } from '../gdpr/gdpr.module';
import { OutboxModule } from '../outbox/outbox.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { CirclesModule } from '../circles/circles.module';

// NotificationService/NotificationPreferencesService provided directly here
// for the same reason as WalletModule/AppointmentsModule/etc — see wallet.module.ts.
// WalletModule/PaymentsModule/CirclesModule were missing for the same
// never-wired-import reason (the split-out admin-*.service.ts files below
// inject WalletService/PaymentsService/CirclesService but this module never
// imported the modules that provide them). VerificationModule was dropped
// entirely (P2-04): VerificationService was injected into the original
// AdminService's constructor but never actually called anywhere in it.
//
// P2-04: AdminService was split by domain area (users/finance/community/
// content) to bring it under BACKLOG_STATUS.md's 1000-LOC target — see
// admin.service.ts's own comment and ProBacklog-v1.md for the rationale.
@Module({
  imports: [
    GdprModule,
    OutboxModule,
    NotificationsModule,
    WalletModule,
    PaymentsModule,
    CirclesModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminUsersService,
    AdminFinanceService,
    AdminCommunityService,
    AdminContentService,
    AdminAnnouncementsService,
    AuditService,
    InactivePractitionerMonitorService,
    AdminMarketplaceService,
    AdminAcademyService,
    AdminTrustScoreService,
    AdminPlatformSettingsService,
    NotificationService,
    NotificationPreferencesService,
  ],
  exports: [AdminService, InactivePractitionerMonitorService],
})
export class AdminModule {}
