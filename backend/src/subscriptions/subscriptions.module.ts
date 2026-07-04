import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

// NotificationService + NotificationPreferencesService provided directly here
// for the same reason as WalletModule/AppointmentsModule — see wallet.module.ts.
@Module({
  imports: [PrismaModule, SharedModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, NotificationService, NotificationPreferencesService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
