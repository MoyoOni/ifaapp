import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { NotificationService } from '../notifications/notification.service';

// COMMUNITY_BACKLOG.md FOR-005 (platform owner decision, July 29, 2026):
// content moderation queue for Circle feed posts, mirroring
// ForumService's reportPost/getReports/reviewReport. Follows the same
// fresh-narrow-file pattern as circles-feed-reactions.service.spec.ts,
// since the main circles.service.spec.ts is entirely describe.skip'd.
describe('CirclesService feed moderation', () => {
  let service: CirclesService;

  const mockPrismaService = {
    circleFeedPost: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    circleFeedReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const adminUser = { id: 'admin-1', role: 'ADMIN' } as any;
  const clientUser = { id: 'client-1', role: 'CLIENT' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CirclesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CrisisDetectionService, useValue: { detect: jest.fn().mockReturnValue(false) } },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CirclesService>(CirclesService);
  });

  describe('reportFeedPost', () => {
    it('throws NotFoundException for a missing post', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue(null);
      await expect(
        service.reportFeedPost('post-1', 'spam', undefined, clientUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for an already-hidden post', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', status: 'HIDDEN' });
      await expect(
        service.reportFeedPost('post-1', 'spam', undefined, clientUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('records a report for a visible post', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', status: 'VISIBLE' });
      mockPrismaService.circleFeedReport.create.mockResolvedValue({});

      const result = await service.reportFeedPost('post-1', 'spam', 'looks like an ad', clientUser);

      expect(mockPrismaService.circleFeedReport.create).toHaveBeenCalledWith({
        data: { reporterId: 'client-1', postId: 'post-1', reason: 'spam', note: 'looks like an ad' },
      });
      expect(result).toEqual({ reported: true });
    });

    it('rejects a duplicate report from the same user (unique constraint violation)', async () => {
      mockPrismaService.circleFeedPost.findUnique.mockResolvedValue({ id: 'post-1', status: 'VISIBLE' });
      mockPrismaService.circleFeedReport.create.mockRejectedValue(new Error('unique constraint'));

      await expect(
        service.reportFeedPost('post-1', 'spam', undefined, clientUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFeedReports', () => {
    it('rejects a non-admin', async () => {
      await expect(service.getFeedReports(clientUser)).rejects.toThrow(ForbiddenException);
    });

    it('returns pending reports by default, for an admin', async () => {
      mockPrismaService.circleFeedReport.findMany.mockResolvedValue([{ id: 'report-1' }]);
      const result = await service.getFeedReports(adminUser);
      expect(mockPrismaService.circleFeedReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } })
      );
      expect(result).toEqual([{ id: 'report-1' }]);
    });
  });

  describe('reviewFeedReport', () => {
    it('rejects a non-admin', async () => {
      await expect(service.reviewFeedReport('report-1', 'dismiss', clientUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('throws NotFoundException for a missing report', async () => {
      mockPrismaService.circleFeedReport.findUnique.mockResolvedValue(null);
      await expect(service.reviewFeedReport('report-1', 'dismiss', adminUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('hides the post and marks the report reviewed on hide_post', async () => {
      mockPrismaService.circleFeedReport.findUnique.mockResolvedValue({
        id: 'report-1',
        postId: 'post-1',
        post: { authorId: 'author-1', circleId: 'circle-1' },
      });
      mockPrismaService.circleFeedPost.update.mockResolvedValue({});
      mockPrismaService.circleFeedReport.update.mockResolvedValue({ status: 'REVIEWED' });

      await service.reviewFeedReport('report-1', 'hide_post', adminUser);

      expect(mockPrismaService.circleFeedPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'HIDDEN' },
      });
      expect(mockPrismaService.circleFeedReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { status: 'REVIEWED', action: 'hide_post', reviewedBy: 'admin-1', reviewedAt: expect.any(Date) },
      });
    });

    it('does not touch the post on dismiss', async () => {
      mockPrismaService.circleFeedReport.findUnique.mockResolvedValue({
        id: 'report-1',
        postId: 'post-1',
        post: { authorId: 'author-1', circleId: 'circle-1' },
      });
      mockPrismaService.circleFeedReport.update.mockResolvedValue({ status: 'REVIEWED' });

      await service.reviewFeedReport('report-1', 'dismiss', adminUser);

      expect(mockPrismaService.circleFeedPost.update).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('notifies the author on warn_user without hiding the post', async () => {
      mockPrismaService.circleFeedReport.findUnique.mockResolvedValue({
        id: 'report-1',
        postId: 'post-1',
        post: { authorId: 'author-1', circleId: 'circle-1' },
      });
      mockPrismaService.circleFeedReport.update.mockResolvedValue({ status: 'REVIEWED' });

      await service.reviewFeedReport('report-1', 'warn_user', adminUser);

      expect(mockPrismaService.circleFeedPost.update).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'author-1' })
      );
    });
  });
});
