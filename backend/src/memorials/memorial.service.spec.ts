import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemorialService } from './memorial.service';
import { PrismaService } from '../prisma/prisma.service';

// COMMUNITY_BACKLOG.md FOR-015 / ProBacklog-v1.md item #3: soft-deleted --
// grief/remembrance content someone wrote about a lost loved one shouldn't
// be permanently destroyed on a misclick.
describe('MemorialService', () => {
  let service: MemorialService;

  const mockPrismaService = {
    memorialEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MemorialService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<MemorialService>(MemorialService);
  });

  describe('create', () => {
    it('creates a memorial entry for the given author', async () => {
      mockPrismaService.memorialEntry.create.mockResolvedValue({ id: 'entry-1' });

      const result = await service.create(
        { name: 'Grandmother', relationship: 'Grandmother', message: 'Forever in our hearts', isPublic: true },
        'author-1'
      );

      expect(result).toEqual({ id: 'entry-1' });
      expect(mockPrismaService.memorialEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ authorId: 'author-1' }) })
      );
    });
  });

  describe('findPublic', () => {
    it('excludes soft-deleted entries', async () => {
      mockPrismaService.memorialEntry.findMany.mockResolvedValue([]);
      mockPrismaService.memorialEntry.count.mockResolvedValue(0);

      await service.findPublic();

      expect(mockPrismaService.memorialEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublic: true, deletedAt: null } })
      );
      expect(mockPrismaService.memorialEntry.count).toHaveBeenCalledWith({
        where: { isPublic: true, deletedAt: null },
      });
    });
  });

  describe('delete', () => {
    it('soft-deletes instead of hard-deleting the row', async () => {
      mockPrismaService.memorialEntry.findUnique.mockResolvedValue({ id: 'entry-1', authorId: 'author-1' });
      mockPrismaService.memorialEntry.update.mockResolvedValue({ id: 'entry-1', deletedAt: new Date() });

      await service.delete('entry-1', 'author-1', false);

      expect(mockPrismaService.memorialEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'entry-1', deletedAt: null },
      });
      expect(mockPrismaService.memorialEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('throws NotFoundException for an already soft-deleted (or missing) entry', async () => {
      mockPrismaService.memorialEntry.findUnique.mockResolvedValue(null);

      await expect(service.delete('entry-1', 'author-1', false)).rejects.toThrow(NotFoundException);
    });

    it('rejects a user removing someone else\'s entry', async () => {
      mockPrismaService.memorialEntry.findUnique.mockResolvedValue({ id: 'entry-1', authorId: 'author-1' });

      await expect(service.delete('entry-1', 'someone-else', false)).rejects.toThrow(ForbiddenException);
    });

    it('allows an admin to remove any entry', async () => {
      mockPrismaService.memorialEntry.findUnique.mockResolvedValue({ id: 'entry-1', authorId: 'author-1' });
      mockPrismaService.memorialEntry.update.mockResolvedValue({});

      await expect(service.delete('entry-1', 'admin-1', true)).resolves.toBeDefined();
    });
  });
});
