import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommunityMentorshipService } from './community-mentorship.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('CommunityMentorshipService', () => {
  let service: CommunityMentorshipService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    communityMentorship: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    userBadge: { findMany: jest.fn() },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityMentorshipService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CommunityMentorshipService>(CommunityMentorshipService);
  });

  describe('getAvailableMentors', () => {
    it('excludes mentors already at the active mentee cap', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'mentor-1',
          name: 'Full Mentor',
          yorubaName: null,
          avatar: null,
          specialization: [],
          availabilityNote: null,
          _count: { communityMentorshipsAsMentor: 3 },
        },
        {
          id: 'mentor-2',
          name: 'Open Mentor',
          yorubaName: null,
          avatar: null,
          specialization: [],
          availabilityNote: null,
          _count: { communityMentorshipsAsMentor: 1 },
        },
      ]);
      mockPrismaService.communityMentorship.groupBy.mockResolvedValue([
        { mentorId: 'mentor-1', _count: { id: 3 } },
        { mentorId: 'mentor-2', _count: { id: 1 } },
      ]);

      const result = await service.getAvailableMentors('newcomer-1');

      expect(result.map((m) => m.id)).toEqual(['mentor-2']);
    });

    it('only queries users who opted in via answersElderQuestions', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.communityMentorship.groupBy.mockResolvedValue([]);

      await service.getAvailableMentors('newcomer-1');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ answersElderQuestions: true }) })
      );
    });
  });

  describe('requestMentorship', () => {
    it('rejects a duplicate active mentorship request', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.requestMentorship('newcomer-1', { mentorUserId: 'mentor-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects self-mentorship', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);

      await expect(service.requestMentorship('user-1', { mentorUserId: 'user-1' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('throws NotFoundException when the mentor does not exist', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestMentorship('newcomer-1', { mentorUserId: 'ghost' })
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a mentor who has not opted in to answersElderQuestions', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'mentor-1',
        answersElderQuestions: false,
      });

      await expect(
        service.requestMentorship('newcomer-1', { mentorUserId: 'mentor-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the mentor is already at the mentee cap', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'mentor-1',
        answersElderQuestions: true,
      });
      mockPrismaService.communityMentorship.count.mockResolvedValue(3);

      await expect(
        service.requestMentorship('newcomer-1', { mentorUserId: 'mentor-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the mentorship and notifies the mentor', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'mentor-1',
        answersElderQuestions: true,
      });
      mockPrismaService.communityMentorship.count.mockResolvedValue(0);
      mockPrismaService.communityMentorship.create.mockResolvedValue({
        id: 'mentorship-1',
        mentorId: 'mentor-1',
        menteeId: 'newcomer-1',
      });

      const result = await service.requestMentorship('newcomer-1', { mentorUserId: 'mentor-1' });

      expect(result.id).toBe('mentorship-1');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'mentor-1' })
      );
    });
  });

  describe('completeMentorship', () => {
    it('throws NotFoundException when the mentorship does not exist', async () => {
      mockPrismaService.communityMentorship.findUnique.mockResolvedValue(null);

      await expect(service.completeMentorship('missing', 'mentor-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('rejects a user who is not the mentor', async () => {
      mockPrismaService.communityMentorship.findUnique.mockResolvedValue({
        id: 'mentorship-1',
        mentorId: 'mentor-1',
        menteeId: 'newcomer-1',
        status: 'ACTIVE',
      });

      await expect(service.completeMentorship('mentorship-1', 'newcomer-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('rejects an already-completed mentorship', async () => {
      mockPrismaService.communityMentorship.findUnique.mockResolvedValue({
        id: 'mentorship-1',
        mentorId: 'mentor-1',
        menteeId: 'newcomer-1',
        status: 'COMPLETED',
      });

      await expect(service.completeMentorship('mentorship-1', 'mentor-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('marks the mentorship complete and notifies the mentee', async () => {
      mockPrismaService.communityMentorship.findUnique.mockResolvedValue({
        id: 'mentorship-1',
        mentorId: 'mentor-1',
        menteeId: 'newcomer-1',
        status: 'ACTIVE',
      });
      mockPrismaService.communityMentorship.update.mockResolvedValue({
        id: 'mentorship-1',
        status: 'COMPLETED',
      });

      const result = await service.completeMentorship('mentorship-1', 'mentor-1');

      expect(result.status).toBe('COMPLETED');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'newcomer-1' })
      );
    });
  });

  // FOR-023 (owner decision November 2, 2026)
  describe('getMilestoneSuggestions', () => {
    const mentor = (id: string, active: number) => ({ id, name: id, _count: { communityMentorshipsAsMentor: 0 }, active });

    it('suggests up to three available mentors who already reached the milestone, least busy first', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue(null);
      mockPrismaService.userBadge.findMany.mockResolvedValue([{ userId: 'm1' }, { userId: 'm2' }, { userId: 'm3' }, { userId: 'm4' }]);
      mockPrismaService.user.findMany.mockResolvedValue(['m1', 'm2', 'm3', 'm4', 'not-there-yet'].map((id) => mentor(id, 0)));
      mockPrismaService.communityMentorship.groupBy.mockResolvedValue([
        { mentorId: 'm1', _count: { id: 2 } },
        { mentorId: 'm2', _count: { id: 3 } }, // full
        { mentorId: 'm3', _count: { id: 1 } },
      ]);

      const result = await service.getMilestoneSuggestions('member-1', 'cultural-scholar');

      expect(result.mentors.map((m) => m.id)).toEqual(['m4', 'm3', 'm1']);
      expect(mockPrismaService.userBadge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { badgeKey: 'cultural-scholar', userId: { not: 'member-1' } } })
      );
    });

    it('suggests no one to a member who already has a mentor', async () => {
      mockPrismaService.communityMentorship.findFirst.mockResolvedValue({ id: 'cm-1' });
      const result = await service.getMilestoneSuggestions('member-1', 'rooted');
      expect(result).toMatchObject({ hasMentor: true, mentors: [] });
      expect(mockPrismaService.userBadge.findMany).not.toHaveBeenCalled();
    });

    it('rejects a badge that is not a growth milestone', async () => {
      await expect(service.getMilestoneSuggestions('member-1', 'voice')).rejects.toThrow('Unknown milestone');
    });
  });
});
