import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxService } from './outbox.service';
import { OutboxPollerService } from './outbox-poller.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

// NotificationService and NotificationPreferencesService are provided
// directly here rather than imported from a shared module — there isn't one
// that exports them. Other modules that use NotificationService
// (moderation.module.ts) do the same thing; NotificationPreferencesService
// specifically appears to not be registered as a provider anywhere else in
// the app at all, which would make NotificationService's DI fail wherever it
// isn't also provided directly like this — a separate, pre-existing issue
// noted in ProBacklog-v1.md, not fixed here.
//
// forwardRef(() => WhatsAppModule): OutboxService.dispatch() calls back into
// WhatsAppService.sendRaw() to retry a dead-lettered WhatsApp send, and
// WhatsAppService.sendTemplateMessage() calls OutboxService.createEvent() to
// record one — a genuine mutual dependency between the two modules/services,
// not just an import ordering issue, matching the existing
// ForumModule/MessagingModule forwardRef pattern in this codebase.
@Module({
  imports: [PrismaModule, forwardRef(() => WhatsAppModule)],
  providers: [
    OutboxService,
    OutboxPollerService,
    NotificationService,
    NotificationPreferencesService,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
