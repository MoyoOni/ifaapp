import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/email.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { UsersService } from '../users/users.service';

// COMMUNITY_BACKLOG.md FOR-004: "Structured thread series for core concepts"
// + "Integration with Academy course recommendations". Scoped to just
// getThreadSeries/getThreadsInSeries, same narrow-spec-file convention as
// forum-thread-soft-delete.service.spec.ts rather than one giant
// forum.service.spec.ts.

describe('ForumService — learning pathways (COMMUNITY_BACKLOG.md FOR-004)', () => {
  let service: ForumService;

  const mockPrismaService = {
    forumThread: {
      findMany: jest.fn(),
    },
    forumPost: {
      findMany: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
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

  describe('getThreadSeries', () => {
    it('groups teaching-series threads by seriesName with a thread count', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([
        {
          seriesName: 'Ifá Fundamentals',
          category: { id: 'cat-1', name: 'Seeker Questions', slug: 'seeker-questions' },
          createdAt: new Date('2026-01-01'),
        },
        {
          seriesName: 'Ifá Fundamentals',
          category: { id: 'cat-1', name: 'Seeker Questions', slug: 'seeker-questions' },
          createdAt: new Date('2026-01-02'),
        },
        {
          seriesName: 'Odù Basics',
          category: { id: 'cat-2', name: 'Teachings', slug: 'teachings' },
          createdAt: new Date('2026-01-03'),
        },
      ]);

      const result = await service.getThreadSeries();

      expect(result).toEqual([
        expect.objectContaining({ seriesName: 'Ifá Fundamentals', threadCount: 2 }),
        expect.objectContaining({ seriesName: 'Odù Basics', threadCount: 1 }),
      ]);
    });

    it('returns an empty list when no teaching series exist', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([]);

      const result = await service.getThreadSeries();

      expect(result).toEqual([]);
    });
  });

  describe('getThreadsInSeries', () => {
    const seriesThreads = [
      { id: 'thread-1', title: 'Introduction to Ifá Divination', seriesName: 'Ifá Fundamentals' },
      { id: 'thread-2', title: 'The Role of the Babalawo', seriesName: 'Ifá Fundamentals' },
    ];

    beforeEach(() => {
      mockPrismaService.forumThread.findMany.mockResolvedValue(seriesThreads);
      mockPrismaService.course.findMany.mockResolvedValue([]);
    });

    it('returns myProgress as null when no current user is given', async () => {
      const result = await service.getThreadsInSeries('Ifá Fundamentals');

      expect(result.myProgress).toBeNull();
      expect(mockPrismaService.forumPost.findMany).not.toHaveBeenCalled();
    });

    it('computes myProgress from how many series threads the current user posted in', async () => {
      mockPrismaService.forumPost.findMany.mockResolvedValue([{ threadId: 'thread-1' }]);

      const result = await service.getThreadsInSeries('Ifá Fundamentals', { id: 'user-1' } as any);

      expect(result.myProgress).toEqual({ postedInThreads: 1, totalThreads: 2 });
    });

    it('recommends courses matching keywords from the series title and thread titles', async () => {
      mockPrismaService.course.findMany.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Ifá Divination for Beginners',
          slug: 'ifa-divination',
          category: 'Divination',
          level: 'BEGINNER',
          thumbnail: null,
          price: 5000,
          currency: 'NGN',
        },
      ]);

      const result = await service.getThreadsInSeries('Ifá Fundamentals');

      expect(result.recommendedCourses).toHaveLength(1);
      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'APPROVED' }) })
      );
    });

    it('returns no recommended courses when the series has no threads', async () => {
      mockPrismaService.forumThread.findMany.mockResolvedValue([]);

      const result = await service.getThreadsInSeries('Empty Series');

      expect(result.recommendedCourses).toEqual([]);
      expect(mockPrismaService.course.findMany).not.toHaveBeenCalled();
    });
  });
});
