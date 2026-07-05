import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PushNotificationService } from './push/push-notification.service';

// NotificationsController (register-device-token, the route the frontend's
// firebase-messaging.ts actually calls) was never registered by any module —
// it and the DeviceToken-based PushNotificationService it depends on both
// sat completely unwired, 404ing in a live app. Following the same
// provide-directly pattern already established for NotificationService/
// NotificationPreferencesService elsewhere (see wallet.module.ts, P1-01) —
// NotificationsModule itself is what's missing them, not a design this
// module should diverge from.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationService, NotificationPreferencesService, PushNotificationService],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationsModule {}
