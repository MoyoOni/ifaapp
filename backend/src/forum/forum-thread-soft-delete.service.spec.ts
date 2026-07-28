import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ThreadStatus } from '@ile-ase/common';
import { ForumService } from './forum.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { UsersService } from '../users/users.service';

// P0-03: covers the three ForumThread hard-delete call sites that were fixed
// to match the existing deleteThread() soft-delete convention (status:
// ThreadStatus.DELETED). The pre-existing forum.service.spec.ts references
// modules/enums that no longer exist (@common/enums/forum-thread-status.enum)
// and fails to even load — this is a small, independently-working file
// scoped to just the methods this change touched, not a replacement for it.

describe('ForumService — thread soft delete (P0-03)', () => {
  let service: ForumService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'a@example.com', verified: true } as any;
  const mockNonAdmin = {
    id: 'user-1',
    role: 'CLIENT',
    email: 'u@example.com',
    verified: true,
  } as any;

  const mockPrismaService = {
    forumThread: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    forumPost: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagingGateway, useValue: {} },
        { provide: NotificationService, useValue: { createNotification: jest.fn() } },
        { provide: EmailService, useValue: {} },
        { provide: CrisisDetectionService, useValue: { detect: jest.fn().mockReturnValue(false) } },
        { provide: UsersService, useValue: { awardXP: jest.fn() } },
      ],
    }).compile();

    service = module.get<ForumService>(ForumService);
  });

  describe('deleteThreadForAdmin', () => {
    it('soft-deletes the thread instead of removing the row', async () => {
      mockPrismaService.forumThread.findUnique.mockResolvedValue({
        id: 'thread-1',
        status: 'ACTIVE',
      });
      mockPrismaService.forumThread.update.mockResolvedValue({
        id: 'thread-1',
        status: ThreadStatus.DELETED,
      });

      const result = await service.deleteThreadForAdmin('thread-1', mockAdmin, 'spam');

      expect(result.status).toBe(ThreadStatus.DELETED);
      expect(mockPrismaService.forumThread.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { status: ThreadStatus.DELETED },
      });
      expect(mockPrismaService.forumThread.delete).not.toHaveBeenCalled();
    });

    it('rejects a non-admin caller', async () => {
      await expect(service.deleteThreadForAdmin('thread-1', mockNonAdmin)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockPrismaService.forumThread.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing thread', async () => {
      mockPrismaService.forumThread.findUnique.mockResolvedValue(null);

      await expect(service.deleteThreadForAdmin('missing-thread', mockAdmin)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('adminDeleteThread', () => {
    it('soft-deletes the thread instead of removing the row', async () => {
      mockPrismaService.forumThread.findUnique.mockResolvedValue({
        id: 'thread-2',
        status: 'ACTIVE',
      });
      mockPrismaService.forumThread.update.mockResolvedValue({
        id: 'thread-2',
        status: ThreadStatus.DELETED,
      });

      const result = await service.adminDeleteThread('thread-2', mockAdmin, 'off-topic');

      expect(result.status).toBe(ThreadStatus.DELETED);
      expect(mockPrismaService.forumThread.delete).not.toHaveBeenCalled();
    });
  });

  describe('mergeThreads', () => {
    it('soft-deletes the secondary thread after merging (P0-03)', async () => {
      // Both lookups resolve to same-category threads so the merge proceeds.
      mockPrismaService.forumThread.findUnique.mockResolvedValue({
        id: 'thread',
        categoryId: 'cat-1',
      });
      mockPrismaService.forumPost.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.forumPost.findMany.mockResolvedValue([
        { id: 'post-1', createdAt: new Date(), authorId: 'user-1' },
      ]);
      mockPrismaService.forumPost.count.mockResolvedValue(3);
      mockPrismaService.forumThread.update.mockResolvedValue({});

      await service.mergeThreads('primary-thread', 'secondary-thread', mockAdmin);

      expect(mockPrismaService.forumThread.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'secondary-thread' },
          data: { status: ThreadStatus.DELETED },
        })
      );
      expect(mockPrismaService.forumThread.delete).not.toHaveBeenCalled();
    });
  });
});
