import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionLifecycleCronService } from './subscription-lifecycle-cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { PaymentsModule } from '../payments/payments.module';

// NotificationService + NotificationPreferencesService provided directly here
// for the same reason as WalletModule/AppointmentsModule — see wallet.module.ts.
// PaymentsModule imported for PaystackApiService (HUMAN_BACKLOG.md: real
// subscription-disable calls, not a raw unguarded fetch()).
@Module({
  imports: [PrismaModule, SharedModule, NotificationsModule, PaymentsModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    NotificationService,
    NotificationPreferencesService,
    SubscriptionLifecycleCronService,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
