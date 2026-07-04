import { Module, forwardRef } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { EmailService } from '../notifications/email.service';

// NotificationService/NotificationPreferencesService/EmailService provided
// directly here for the same reason as WalletModule/AppointmentsModule/
// SubscriptionsModule/UsersModule — see wallet.module.ts.
@Module({
  imports: [forwardRef(() => MessagingModule), NotificationsModule],
  controllers: [ForumController],
  providers: [ForumService, NotificationService, NotificationPreferencesService, EmailService],
  exports: [ForumService],
})
export class ForumModule {}
