import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LocationService } from './location.service';
import { CurrencyService } from './currency.service';
import { WebhookMonitorService } from './webhook-monitor.service';
import { PaystackApiService } from './paystack-api.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CacheModule } from '../cache/cache.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

// NotificationService + NotificationPreferencesService provided directly
// here for the same reason as wallet.module.ts (P1-01): PaymentsService has
// always injected NotificationService, but neither it nor its own mandatory
// NotificationPreferencesService dependency was ever actually provided by
// this module or NotificationsModule (which only provides
// PushNotificationService, despite the similar name).
@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule), NotificationsModule, CacheModule],
  providers: [
    PaymentsService,
    PaystackApiService,
    LocationService,
    CurrencyService,
    WebhookMonitorService,
    NotificationService,
    NotificationPreferencesService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService, CurrencyService],
})
export class PaymentsModule {}
