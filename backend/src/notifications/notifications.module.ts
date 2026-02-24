import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../common/queue/queue.module';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationService, EmailService, PushNotificationService, NotificationProcessor],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationsModule {}
