import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { PushNotificationService } from './push/push-notification.service';
import { JobQueueService } from '../queues/job-queue.service';
import { DatabaseModule } from '../database/database.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabaseModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationService,
    EmailService,
    PushNotificationService,
    JobQueueService,
  ],
  exports: [NotificationService, EmailService, PushNotificationService],
})
export class NotificationsModule {}
