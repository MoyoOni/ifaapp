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
import { OutboxModule } from '../outbox/outbox.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { VerificationModule } from '../verification/verification.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { CirclesModule } from '../circles/circles.module';

// NotificationService/NotificationPreferencesService provided directly here
// for the same reason as WalletModule/AppointmentsModule/etc — see wallet.module.ts.
// VerificationModule/WalletModule/PaymentsModule/CirclesModule were missing
// for the same never-wired-import reason (AdminService injects all four
// services but this module never imported the modules that provide them).
@Module({
  imports: [GdprModule, OutboxModule, NotificationsModule, VerificationModule, WalletModule, PaymentsModule, CirclesModule],
  controllers: [AdminController],
  providers: [
    AdminService,
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
