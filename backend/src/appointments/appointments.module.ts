import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ConsultationNotesService } from './consultation-notes.service';
import { ConsultationNotesController } from './consultation-notes.controller';
import { ClientSessionNotesService } from './client-session-notes.service';
import { ClientSessionNotesController } from './client-session-notes.controller';

@Module({
  controllers: [AppointmentsController, ConsultationNotesController, ClientSessionNotesController],
  providers: [AppointmentsService, ConsultationNotesService, ClientSessionNotesService],
  exports: [AppointmentsService, ConsultationNotesService, ClientSessionNotesService],
})
export class AppointmentsModule {}