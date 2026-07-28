import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DreamService } from './dream.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DreamService (ProBacklog-v1.md item #12: soft-delete audit)', () => {
  let service: DreamService;

  const mockPrismaService = {
    dreamEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DreamService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<DreamService>(DreamService);
  });

  describe('delete', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.dreamEntry.findUnique.mockResolvedValue({
        id: 'dream-1',
        authorId: 'user-1',
      });
      mockPrismaService.dreamEntry.update.mockResolvedValue({ id: 'dream-1' });

      await service.delete('dream-1', 'user-1', false);

      expect(mockPrismaService.dreamEntry.update).toHaveBeenCalledWith({
        where: { id: 'dream-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('excludes already-deleted entries from the lookup (idempotent 404, not a re-timestamp)', async () => {
      mockPrismaService.dreamEntry.findUnique.mockResolvedValue(null);

      await expect(service.delete('dream-1', 'user-1', false)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.dreamEntry.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it('rejects deleting another user\'s dream entry unless admin', async () => {
      mockPrismaService.dreamEntry.findUnique.mockResolvedValue({
        id: 'dream-1',
        authorId: 'someone-else',
      });

      await expect(service.delete('dream-1', 'user-1', false)).rejects.toThrow(ForbiddenException);
    });

    it('allows an admin to delete any dream entry', async () => {
      mockPrismaService.dreamEntry.findUnique.mockResolvedValue({
        id: 'dream-1',
        authorId: 'someone-else',
      });
      mockPrismaService.dreamEntry.update.mockResolvedValue({ id: 'dream-1' });

      await expect(service.delete('dream-1', 'admin-1', true)).resolves.toBeDefined();
    });
  });

  describe('read paths filter out soft-deleted entries', () => {
    it('findMine', async () => {
      mockPrismaService.dreamEntry.findMany.mockResolvedValue([]);
      await service.findMine('user-1');
      expect(mockPrismaService.dreamEntry.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('findShared', async () => {
      mockPrismaService.dreamEntry.findMany.mockResolvedValue([]);
      mockPrismaService.dreamEntry.count.mockResolvedValue(0);
      await service.findShared();
      expect(mockPrismaService.dreamEntry.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
      expect(mockPrismaService.dreamEntry.count.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('findInterpretationRequests', async () => {
      mockPrismaService.dreamEntry.findMany.mockResolvedValue([]);
      await service.findInterpretationRequests('BABALAWO');
      expect(mockPrismaService.dreamEntry.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });
});
