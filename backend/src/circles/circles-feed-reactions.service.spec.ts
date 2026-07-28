import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { NotificationService } from '../notifications/notification.service';

// Focused spec for the circle feed like/comment methods (whole-app audit
// loose end) -- the main circles.service.spec.ts is entirely describe.skip'd
// against a stale pre-refactor API shape, so this is a fresh, narrow file
// rather than an addition to that one (matches circles-suggest.service.spec.ts).
describe('CirclesService feed reactions', () => {
  let service: CirclesService;

  const mockPrismaService = {
    circleFeedPost: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    circleFeedLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    circleFeedComment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    circleMember: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CirclesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CrisisDetectionService, useValue: { detect: jest.fn().mockReturnValue(false) } },
        { provide: NotificationService, useValue: {} },
      ],
    }).compile();

    service = module.get<CirclesService>(CirclesService);
  });

  describe('toggleFeedPostLike', () => {
    it('throws NotFoundException for a missing post', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue(null);
      await expect(service.toggleFeedPostLike('post-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('likes a post the user has not liked yet', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', likes: 2 });
      mockPrismaService.circleFeedLike.findUnique.mockResolvedValue(null);

      const result = await service.toggleFeedPostLike('post-1', 'user-1');

      expect(mockPrismaService.circleFeedLike.create).toHaveBeenCalledWith({
        data: { postId: 'post-1', userId: 'user-1' },
      });
      expect(result).toEqual({ liked: true, likes: 3 });
    });

    it('unlikes a post the user already liked (toggle off)', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', likes: 3 });
      mockPrismaService.circleFeedLike.findUnique.mockResolvedValue({ id: 'like-1' });

      const result = await service.toggleFeedPostLike('post-1', 'user-1');

      expect(mockPrismaService.circleFeedLike.delete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
      expect(result).toEqual({ liked: false, likes: 2 });
    });
  });

  describe('getFeedPostComments', () => {
    it('returns comments oldest first with flattened author fields', async () => {
      mockPrismaService.circleFeedComment.findMany.mockResolvedValue([
        {
          id: 'c1',
          content: 'Beautiful share',
          createdAt: new Date('2026-01-01'),
          author: { id: 'u1', name: 'Amara', avatar: null },
        },
      ]);

      const result = await service.getFeedPostComments('post-1');

      expect(mockPrismaService.circleFeedComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' }, orderBy: { createdAt: 'asc' } })
      );
      expect(result).toEqual([
        { id: 'c1', authorId: 'u1', authorName: 'Amara', authorAvatar: null, content: 'Beautiful share', createdAt: new Date('2026-01-01') },
      ]);
    });
  });

  describe('addFeedPostComment', () => {
    it('throws NotFoundException for a missing post', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue(null);
      await expect(service.addFeedPostComment('post-1', 'user-1', 'hi')).rejects.toThrow(NotFoundException);
    });

    it('rejects a non-member', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', circleId: 'circle-1' });
      mockPrismaService.circleMember.findUnique.mockResolvedValue(null);

      await expect(service.addFeedPostComment('post-1', 'user-1', 'hi')).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.circleFeedComment.create).not.toHaveBeenCalled();
    });

    it('creates a comment and increments the post commentCount for an active member', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', circleId: 'circle-1' });
      mockPrismaService.circleMember.findUnique.mockResolvedValue({ status: 'ACTIVE' });
      mockPrismaService.circleFeedComment.create.mockResolvedValue({
        id: 'c1',
        content: 'hi',
        createdAt: new Date('2026-01-01'),
        author: { id: 'user-1', name: 'Amara', avatar: null },
      });

      const result = await service.addFeedPostComment('post-1', 'user-1', 'hi');

      expect(mockPrismaService.circleFeedComment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { postId: 'post-1', authorId: 'user-1', content: 'hi' } })
      );
      expect(mockPrismaService.circleFeedPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { commentCount: { increment: 1 } },
      });
      expect(result).toEqual({
        id: 'c1',
        authorId: 'user-1',
        authorName: 'Amara',
        authorAvatar: null,
        content: 'hi',
        createdAt: new Date('2026-01-01'),
      });
    });
  });
});
