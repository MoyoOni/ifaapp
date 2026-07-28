import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsultationNotesService } from './consultation-notes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConsultationNotesService', () => {
  let service: ConsultationNotesService;

  const babalawoUser = { id: 'babalawo-1', role: 'BABALAWO' } as any;
  const otherBabalawoUser = { id: 'babalawo-2', role: 'BABALAWO' } as any;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    consultationNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationNotesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ConsultationNotesService>(ConsultationNotesService);
  });

  describe('findNotesForClient', () => {
    it('throws ForbiddenException when the caller is not the named babalawo', async () => {
      await expect(
        service.findNotesForClient('babalawo-1', 'client-1', otherBabalawoUser)
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the client has no BabalawoClient relationship with this babalawo', async () => {
      // Regression test for the bug this story fixed: the client-side
      // relation is `clientsAsBabalawo` (relationships where this user is
      // the client), not `babalawoClients` (relationships where this user
      // is the babalawo) -- checking the wrong side made this always empty
      // for a real client, causing a 403 on essentially every real pair.
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'client-1',
        clientsAsBabalawo: [],
      });

      await expect(
        service.findNotesForClient('babalawo-1', 'client-1', babalawoUser)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        include: { clientsAsBabalawo: { where: { babalawoId: 'babalawo-1' } } },
      });
    });

    it('throws ForbiddenException when the client does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findNotesForClient('babalawo-1', 'client-1', babalawoUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns notes when a real BabalawoClient relationship exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'client-1',
        clientsAsBabalawo: [{ id: 'rel-1', babalawoId: 'babalawo-1', clientId: 'client-1' }],
      });
      mockPrismaService.consultationNote.findMany.mockResolvedValue([
        { id: 'note-1', title: 'First session', content: 'Notes...' },
      ]);

      const result = await service.findNotesForClient('babalawo-1', 'client-1', babalawoUser);

      expect(result).toEqual([{ id: 'note-1', title: 'First session', content: 'Notes...' }]);
      expect(mockPrismaService.consultationNote.findMany).toHaveBeenCalledWith({
        where: { babalawoId: 'babalawo-1', clientId: 'client-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createNote', () => {
    it('throws ForbiddenException when the caller is not the named babalawo', async () => {
      await expect(
        service.createNote('babalawo-1', 'client-1', { content: 'x' } as any, otherBabalawoUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the client does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createNote('babalawo-1', 'client-1', { content: 'x' } as any, babalawoUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the note when the caller is the babalawo and the client exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'client-1' });
      mockPrismaService.consultationNote.create.mockResolvedValue({ id: 'note-1' });

      const result = await service.createNote(
        'babalawo-1',
        'client-1',
        { title: 'T', content: 'C' } as any,
        babalawoUser
      );

      expect(result).toEqual({ id: 'note-1' });
      expect(mockPrismaService.consultationNote.create).toHaveBeenCalledWith({
        data: { babalawoId: 'babalawo-1', clientId: 'client-1', title: 'T', content: 'C' },
      });
    });
  });

  describe('updateNote', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNote('note-1', { content: 'x' } as any, babalawoUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the caller did not create the note', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue({
        id: 'note-1',
        babalawoId: 'babalawo-1',
      });

      await expect(
        service.updateNote('note-1', { content: 'x' } as any, otherBabalawoUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates the note when the caller created it', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue({
        id: 'note-1',
        babalawoId: 'babalawo-1',
      });
      mockPrismaService.consultationNote.update.mockResolvedValue({
        id: 'note-1',
        content: 'updated',
      });

      const result = await service.updateNote(
        'note-1',
        { title: 'T', content: 'updated' } as any,
        babalawoUser
      );

      expect(result).toEqual({ id: 'note-1', content: 'updated' });
    });
  });

  describe('deleteNote', () => {
    it('throws NotFoundException when the note does not exist', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue(null);

      await expect(service.deleteNote('note-1', babalawoUser)).rejects.toThrow(NotFoundException);
    });

    it('excludes already-deleted notes from the lookup (idempotent 404, not a re-timestamp)', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue(null);

      await expect(service.deleteNote('note-1', babalawoUser)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.consultationNote.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it('throws ForbiddenException when the caller did not create the note', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue({
        id: 'note-1',
        babalawoId: 'babalawo-1',
      });

      await expect(service.deleteNote('note-1', otherBabalawoUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    // ProBacklog-v1.md item #12 (soft-delete audit): a babalawo's professional
    // notes about a client -- soft-deleted (deletedAt) instead of a real
    // Prisma delete.
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.consultationNote.findUnique.mockResolvedValue({
        id: 'note-1',
        babalawoId: 'babalawo-1',
      });
      mockPrismaService.consultationNote.update.mockResolvedValue({ id: 'note-1' });

      const result = await service.deleteNote('note-1', babalawoUser);

      expect(mockPrismaService.consultationNote.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.consultationNote.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'note-1' });
    });
  });

  describe('read paths filter out soft-deleted notes', () => {
    it('findNotesByBabalawo', async () => {
      mockPrismaService.consultationNote.findMany.mockResolvedValue([]);

      await service.findNotesByBabalawo('babalawo-1', babalawoUser);

      expect(mockPrismaService.consultationNote.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });
});
