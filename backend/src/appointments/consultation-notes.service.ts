import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationNoteDto } from './dto/create-consultation-note.dto';
import { UpdateConsultationNoteDto } from './dto/update-consultation-note.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ConsultationNotesService {
  constructor(private prisma: PrismaService) {}

  async createNote(
    babalawoId: string,
    clientId: string,
    dto: CreateConsultationNoteDto,
    currentUser: CurrentUserPayload
  ) {
    // Verify that the current user is the babalawo
    if (currentUser.id !== babalawoId) {
      throw new ForbiddenException('You can only create notes for clients you serve as a babalawo');
    }

    // Verify that the client exists
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Create the note
    return await this.prisma.consultationNote.create({
      data: {
        babalawoId,
        clientId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async findNotesForClient(babalawoId: string, clientId: string, currentUser: CurrentUserPayload) {
    // Verify that the current user is the babalawo for this client
    if (currentUser.id !== babalawoId) {
      throw new ForbiddenException('You can only access notes for clients you serve');
    }

    // Verify that the client exists and belongs to this babalawo. `client`
    // here is the seeker's own User record, so the relation to check is the
    // "relationships where I am the client" side (clientsAsBabalawo,
    // @relation("ClientRelationships")) -- not babalawoClients
    // (@relation("BabalawoRelationships")), which is the reverse direction
    // and would only be non-empty if this same user also separately serves
    // as a babalawo for this exact babalawoId. Checking the wrong side made
    // this 403 for essentially every real babalawo/client pair.
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: {
        clientsAsBabalawo: {
          where: {
            babalawoId,
          },
        },
      },
    });

    if (!client || client.clientsAsBabalawo.length === 0) {
      throw new ForbiddenException('This client is not assigned to you');
    }

    return await this.prisma.consultationNote.findMany({
      where: {
        babalawoId,
        clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findNotesByBabalawo(babalawoId: string, currentUser: CurrentUserPayload) {
    // Verify that the current user is the babalawo
    if (currentUser.id !== babalawoId) {
      throw new ForbiddenException('You can only access notes for clients you serve');
    }

    return await this.prisma.consultationNote.findMany({
      where: {
        babalawoId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateNote(
    noteId: string,
    dto: UpdateConsultationNoteDto,
    currentUser: CurrentUserPayload
  ) {
    // Find the note
    const note = await this.prisma.consultationNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Verify that the current user is the babalawo who created this note
    if (currentUser.id !== note.babalawoId) {
      throw new ForbiddenException('You can only update notes you created');
    }

    // Update the note
    return await this.prisma.consultationNote.update({
      where: { id: noteId },
      data: {
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async deleteNote(noteId: string, currentUser: CurrentUserPayload) {
    // Find the note
    const note = await this.prisma.consultationNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Verify that the current user is the babalawo who created this note
    if (currentUser.id !== note.babalawoId) {
      throw new ForbiddenException('You can only delete notes you created');
    }

    // Delete the note
    return await this.prisma.consultationNote.delete({
      where: { id: noteId },
    });
  }
}
