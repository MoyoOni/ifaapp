import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientSessionNotesService } from './client-session-notes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientSessionNotesService (ProBacklog-v1.md item #12: soft-delete audit)', () => {
  let service: ClientSessionNotesService;

  const mockPrismaService = {
    appointment: { findUnique: jest.fn() },
    clientSessionNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const currentUser = { sub: 'client-1' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientSessionNotesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ClientSessionNotesService>(ClientSessionNotesService);
  });

  describe('remove', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.clientSessionNote.findUnique.mockResolvedValue({
        id: 'note-1',
        clientId: 'client-1',
      });
      mockPrismaService.clientSessionNote.update.mockResolvedValue({ id: 'note-1' });

      await service.remove('note-1', currentUser);

      expect(mockPrismaService.clientSessionNote.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('404s on an already-deleted note instead of re-timestamping it', async () => {
      mockPrismaService.clientSessionNote.findUnique.mockResolvedValue(null);

      await expect(service.remove('note-1', currentUser)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.clientSessionNote.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it("404s (not 403) on someone else's note, to avoid confirming it exists", async () => {
      mockPrismaService.clientSessionNote.findUnique.mockResolvedValue({
        id: 'note-1',
        clientId: 'someone-else',
      });

      await expect(service.remove('note-1', currentUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('read paths filter out soft-deleted notes', () => {
    it('findByAppointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({ clientId: 'client-1' });
      mockPrismaService.clientSessionNote.findMany.mockResolvedValue([]);

      await service.findByAppointment('appt-1', currentUser);

      expect(mockPrismaService.clientSessionNote.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('findByClient', async () => {
      mockPrismaService.clientSessionNote.findMany.mockResolvedValue([]);

      await service.findByClient(currentUser);

      expect(mockPrismaService.clientSessionNote.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('findOne', async () => {
      mockPrismaService.clientSessionNote.findUnique.mockResolvedValue({
        id: 'note-1',
        clientId: 'client-1',
      });

      await service.findOne('note-1', currentUser);

      expect(mockPrismaService.clientSessionNote.findUnique.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });
});
