import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ConsultationNotesService } from './consultation-notes.service';
import { ConsultationNotesController } from './consultation-notes.controller';
import { ClientSessionNotesService } from './client-session-notes.service';
import { ClientSessionNotesController } from './client-session-notes.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';
import { WalletModule } from '../wallet/wallet.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

// NotificationService + NotificationPreferencesService are provided directly
// here for the same reason as WalletModule (see wallet.module.ts): AppointmentsService
// has always injected NotificationService, but neither it nor its mandatory
// NotificationPreferencesService dependency was ever actually provided by this
// module or NotificationsModule — the same pre-existing, wider DI gap noted in
// ProBacklog-v1.md, only caught here once the full AppModule graph could compile.
// WalletModule/WhatsAppModule were missing for the same reason (WalletService/
// WhatsAppService injected in AppointmentsService but never importable here).
@Module({
  imports: [NotificationsModule, WalletModule, WhatsAppModule],
  controllers: [AppointmentsController, ConsultationNotesController, ClientSessionNotesController],
  providers: [
    AppointmentsService,
    ConsultationNotesService,
    ClientSessionNotesService,
    NotificationService,
    NotificationPreferencesService,
  ],
  exports: [AppointmentsService, ConsultationNotesService, ClientSessionNotesService],
})
export class AppointmentsModule {}
