import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserReportsService } from './user-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('UserReportsService', () => {
  let service: UserReportsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userReport: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    contentFlagRule: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.user.findMany.mockResolvedValue([]);
    mockPrismaService.contentFlagRule.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<UserReportsService>(UserReportsService);
  });

  describe('file', () => {
    const dto = {
      reportedUserId: 'user-1',
      reason: 'HARASSMENT',
      description: 'This user sent repeated unwanted messages.',
    };

    it('throws BadRequestException when reporting yourself', async () => {
      await expect(service.file(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the reported user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.file(dto, 'reporter-1')).rejects.toThrow(NotFoundException);
    });

    it('creates a report for any role and notifies admins', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.userReport.create.mockResolvedValue({ id: 'report-1' });
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

      const result = await service.file(dto, 'reporter-1');

      expect(mockPrismaService.userReport.create).toHaveBeenCalledWith({
        data: {
          reporterId: 'reporter-1',
          reportedUserId: 'user-1',
          reason: 'HARASSMENT',
          description: dto.description,
          flaggedByKeywordRule: false,
          matchedKeywords: [],
        },
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'WARNING' })
      );
      expect(result).toEqual({ id: 'report-1' });
    });

    it('flags the report and sends an urgent notification when the description matches an active keyword rule', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.contentFlagRule.findMany.mockResolvedValue([{ value: 'unwanted messages' }]);
      mockPrismaService.userReport.create.mockResolvedValue({ id: 'report-1' });
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

      await service.file(dto, 'reporter-1');

      expect(mockPrismaService.userReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          flaggedByKeywordRule: true,
          matchedKeywords: ['unwanted messages'],
        }),
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'URGENT' })
      );
    });
  });

  describe('findMine', () => {
    it('returns reports filed by the reporter, newest first', async () => {
      mockPrismaService.userReport.findMany.mockResolvedValue([{ id: 'report-1' }]);
      const result = await service.findMine('reporter-1');
      expect(mockPrismaService.userReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reporterId: 'reporter-1' }, orderBy: { createdAt: 'desc' } })
      );
      expect(result).toEqual([{ id: 'report-1' }]);
    });
  });
});
