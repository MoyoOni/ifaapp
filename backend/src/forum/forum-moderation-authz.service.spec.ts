import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ForumService } from './forum.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';

// Covers only the moderator sub-role authorization change made alongside
// gating moderateThread's controller route with @AdminRoles(MODERATOR, SUPER)
// -- forum.service.ts as a whole has no characterization tests protecting
// it (see ProBacklog-v1.md P2-04's forum.service.ts split note), so this is
// deliberately scoped to just the two methods this change touched rather
// than attempting broader coverage.
describe('ForumService moderation authorization', () => {
  let service: ForumService;
  let prisma: PrismaService;

  const mockPrismaService = {
    forumPost: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    forumThread: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const post = { id: 'post-1', authorId: 'author-1', threadId: 'thread-1' };
  const thread = { id: 'thread-1', isApproved: false, isLocked: false, isPinned: false };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagingGateway, useValue: {} },
        { provide: NotificationService, useValue: { createNotification: jest.fn() } },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();

    service = module.get<ForumService>(ForumService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('deletePost', () => {
    it('throws NotFoundException when the post does not exist', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(null);
      await expect(
        service.deletePost('missing', { id: 'user-1', role: 'CLIENT' } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('allows the post author to delete their own post', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      mockPrismaService.forumPost.update.mockResolvedValue({ ...post, status: 'DELETED' });
      mockPrismaService.forumThread.update.mockResolvedValue({});

      await expect(
        service.deletePost('post-1', { id: 'author-1', role: 'CLIENT' } as any)
      ).resolves.toBeDefined();
    });

    it('rejects a non-author CLIENT', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      await expect(
        service.deletePost('post-1', { id: 'other-user', role: 'CLIENT' } as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a non-author ADMIN with an unrelated sub-role (FINANCE)', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      await expect(
        service.deletePost('post-1', {
          id: 'other-user',
          role: 'ADMIN',
          adminSubRole: 'FINANCE',
        } as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a non-author ADMIN with the MODERATOR sub-role', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      mockPrismaService.forumPost.update.mockResolvedValue({ ...post, status: 'DELETED' });
      mockPrismaService.forumThread.update.mockResolvedValue({});

      await expect(
        service.deletePost('post-1', {
          id: 'other-user',
          role: 'ADMIN',
          adminSubRole: 'MODERATOR',
        } as any)
      ).resolves.toBeDefined();
    });

    it('allows a non-author ADMIN with the SUPER sub-role', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      mockPrismaService.forumPost.update.mockResolvedValue({ ...post, status: 'DELETED' });
      mockPrismaService.forumThread.update.mockResolvedValue({});

      await expect(
        service.deletePost('post-1', {
          id: 'other-user',
          role: 'ADMIN',
          adminSubRole: 'SUPER',
        } as any)
      ).resolves.toBeDefined();
    });

    it('allows a non-author ADMIN with no sub-role assigned (bootstrap/legacy admin)', async () => {
      mockPrismaService.forumPost.findUnique.mockResolvedValue(post);
      mockPrismaService.forumPost.update.mockResolvedValue({ ...post, status: 'DELETED' });
      mockPrismaService.forumThread.update.mockResolvedValue({});

      await expect(
        service.deletePost('post-1', { id: 'other-user', role: 'ADMIN' } as any)
      ).resolves.toBeDefined();
    });
  });

  describe('moderateThread', () => {
    it('throws ForbiddenException for a non-admin', async () => {
      await expect(
        service.moderateThread('thread-1', 'pin', { id: 'user-1', role: 'CLIENT' } as any)
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.forumThread.findUnique).not.toHaveBeenCalled();
    });

    it('allows an ADMIN (role-level check; sub-role scoping is enforced by the controller guard)', async () => {
      mockPrismaService.forumThread.findUnique.mockResolvedValue(thread);
      mockPrismaService.forumThread.update.mockResolvedValue({ ...thread, isPinned: true });

      await expect(
        service.moderateThread('thread-1', 'pin', {
          id: 'mod-1',
          role: 'ADMIN',
          adminSubRole: 'MODERATOR',
        } as any)
      ).resolves.toBeDefined();
    });
  });
});
