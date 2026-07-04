import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxService } from './outbox.service';
import { OutboxPollerService } from './outbox-poller.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

// NotificationService and NotificationPreferencesService are provided
// directly here rather than imported from a shared module — there isn't one
// that exports them. Other modules that use NotificationService
// (moderation.module.ts) do the same thing; NotificationPreferencesService
// specifically appears to not be registered as a provider anywhere else in
// the app at all, which would make NotificationService's DI fail wherever it
// isn't also provided directly like this — a separate, pre-existing issue
// noted in ProBacklog-v1.md, not fixed here.
@Module({
  imports: [PrismaModule],
  providers: [
    OutboxService,
    OutboxPollerService,
    NotificationService,
    NotificationPreferencesService,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
