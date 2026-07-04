import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { EscrowExpiryService } from './escrow-expiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OutboxModule } from '../outbox/outbox.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

// EscrowExpiryService's @Cron job doesn't need ScheduleModule imported here —
// ScheduleModule.forRoot() is registered once, globally, in app.module.ts
// (P1-01), which is what actually makes @Cron decorators anywhere in the app
// take effect. It was never registered before now (see app.module.ts).
//
// NotificationService + NotificationPreferencesService are provided directly
// here (P1-01 discovery): WalletService has injected NotificationService in
// its constructor all along, but neither it nor NotificationPreferencesService
// (a mandatory dependency of NotificationService) was ever actually provided
// by this module or NotificationsModule (which only provides
// PushNotificationService, despite the similar name) — the same
// pre-existing, wider DI gap noted in ProBacklog-v1.md.
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    OutboxModule,
  ],
  providers: [
    WalletService,
    EscrowExpiryService,
    NotificationService,
    NotificationPreferencesService,
  ],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
