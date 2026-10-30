import { Module, forwardRef } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumAdminService } from './forum-admin.service';
import { ForumDiscoveryService } from './forum-discovery.service';
import { ForumElderService } from './forum-elder.service';
import { ForumCrisisService } from './forum-crisis.service';
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
  providers: [ForumService, ForumAdminService, ForumDiscoveryService, ForumElderService, ForumCrisisService, NotificationService, NotificationPreferencesService, EmailService],
  exports: [ForumService, ForumAdminService, ForumDiscoveryService, ForumElderService, ForumCrisisService],
})
export class ForumModule {}
