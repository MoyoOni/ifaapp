import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { UsersService } from '../users/users.service';

// COMMUNITY_BACKLOG.md FOR-002 fix: a post automatically flagged by crisis
// detection used to stay fully visible to everyone for the entire time it
// sat in the admin welfare-review queue. This is a small, independently-
// working spec scoped to just that behavior (findAllPosts' heldForReview
// filtering, clearCrisisSignal's restore-visibility side effect) -- not a
// replacement for the still-deferred full forum.service.ts test suite
// (see ILUASE_V1_BACKLOG.md's Structural section), same pattern as the
// existing forum-thread-soft-delete.service.spec.ts.
describe('ForumService — crisis-signal review restriction (FOR-002)', () => {
  let service: ForumService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'a@example.com', verified: true } as any;
  const mockAuthor = { id: 'author-1', role: 'CLIENT', email: 'author@example.com', verified: true } as any;
  const mockOtherUser = { id: 'other-1', role: 'CLIENT', email: 'other@example.com', verified: true } as any;

  const mockPrismaService = {
    forumThread: {
      findUnique: jest.fn(),
    },
    forumPost: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.forumPost.findMany.mockResolvedValue([]);

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

  describe('findAllPosts', () => {
    beforeEach(() => {
      mockPrismaService.forumThread.findUnique.mockResolvedValue({ id: 'thread-1', status: 'ACTIVE' });
    });

    it('excludes held-for-review posts for an anonymous visitor', async () => {
      await service.findAllPosts('thread-1', undefined);

      const where = mockPrismaService.forumPost.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([{ heldForReview: false }]);
    });

    it('excludes held-for-review posts for a logged-in non-author, but still lets their own posts through', async () => {
      await service.findAllPosts('thread-1', mockOtherUser);

      const where = mockPrismaService.forumPost.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([{ heldForReview: false }, { authorId: 'other-1' }]);
    });

    it('lets the post author see their own held-for-review post via the OR clause', async () => {
      await service.findAllPosts('thread-1', mockAuthor);

      const where = mockPrismaService.forumPost.findMany.mock.calls[0][0].where;
      expect(where.OR).toContainEqual({ authorId: 'author-1' });
    });

    it('applies no heldForReview restriction at all for an admin', async () => {
      await service.findAllPosts('thread-1', mockAdmin);

      const where = mockPrismaService.forumPost.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeUndefined();
    });
  });

  describe('clearCrisisSignal', () => {
    it('clears hasCrisisSignal and heldForReview, and records who reviewed it', async () => {
      mockPrismaService.forumPost.update.mockResolvedValue({});

      await service.clearCrisisSignal('post-1', 'forum', mockAdmin);

      expect(mockPrismaService.forumPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          hasCrisisSignal: false,
          heldForReview: false,
          reviewedBy: 'admin-1',
          reviewedAt: expect.any(Date),
        }),
      });
    });
  });
});
