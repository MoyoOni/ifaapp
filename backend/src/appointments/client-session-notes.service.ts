import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientSessionNoteDto } from './dto/create-client-session-note.dto';
import { UpdateClientSessionNoteDto } from './dto/update-client-session-note.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ClientSessionNotesService {
  constructor(private prisma: PrismaService) {}

  async create(appointmentId: string, dto: CreateClientSessionNoteDto, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { clientId: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== currentUser.sub) {
      throw new ForbiddenException('Only the client for this appointment may add notes');
    }

    return this.prisma.clientSessionNote.create({
      data: {
        ...dto,
        appointmentId,
        clientId: currentUser.sub,
      },
    });
  }

  async findByAppointment(appointmentId: string, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { clientId: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== currentUser.sub) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.clientSessionNote.findMany({
      where: { appointmentId, clientId: currentUser.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(currentUser: CurrentUserPayload) {
    return this.prisma.clientSessionNote.findMany({
      where: { clientId: currentUser.sub },
      include: { appointment: { select: { date: true, notes: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(noteId: string, currentUser: CurrentUserPayload) {
    const note = await this.prisma.clientSessionNote.findUnique({
      where: { id: noteId },
      include: { appointment: { select: { date: true, notes: true } } },
    });

    if (!note || note.clientId !== currentUser.sub) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async update(noteId: string, currentUser: CurrentUserPayload, dto: UpdateClientSessionNoteDto) {
    const note = await this.prisma.clientSessionNote.findUnique({ where: { id: noteId } });

    if (!note || note.clientId !== currentUser.sub) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.clientSessionNote.update({ where: { id: noteId }, data: dto });
  }

  async remove(noteId: string, currentUser: CurrentUserPayload) {
    const note = await this.prisma.clientSessionNote.findUnique({ where: { id: noteId } });

    if (!note || note.clientId !== currentUser.sub) {
      throw new NotFoundException('Note not found');
    }

    return this.prisma.clientSessionNote.delete({ where: { id: noteId } });
  }
}
