import { Module, forwardRef } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { EmailService } from '../notifications/email.service';
import { UsersModule } from '../users/users.module';

// NotificationService/NotificationPreferencesService/EmailService provided
// directly here for the same reason as WalletModule/AppointmentsModule/
// SubscriptionsModule — see wallet.module.ts. UsersModule is imported (not
// provided directly) for UsersService.awardXP -- see the V8-305 comment on
// ForumService.incrementXP: forum XP now delegates to the one real XP
// implementation instead of maintaining its own parallel system.
@Module({
  imports: [forwardRef(() => MessagingModule), NotificationsModule, UsersModule],
  controllers: [ForumController],
  providers: [ForumService, NotificationService, NotificationPreferencesService, EmailService],
  exports: [ForumService],
})
export class ForumModule {}
