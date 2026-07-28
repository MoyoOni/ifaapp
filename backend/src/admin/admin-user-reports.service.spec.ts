import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminUserReportsService } from './admin-user-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AdminUsersService } from './admin-users.service';

describe('AdminUserReportsService', () => {
  let service: AdminUserReportsService;

  const mockPrismaService = {
    userReport: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminUsersService = {
    suspendUser: jest.fn().mockResolvedValue(undefined),
  };

  const admin = { id: 'admin-1', role: 'ADMIN' } as any;
  const report = {
    id: 'report-1',
    reporterId: 'reporter-1',
    reportedUserId: 'reported-1',
    reason: 'HARASSMENT',
    description: 'Repeated unwanted messages.',
    status: 'OPEN',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.userReport.findUnique.mockResolvedValue(report);
    mockPrismaService.userReport.update.mockImplementation(({ data }: any) => ({
      ...report,
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AdminUsersService, useValue: mockAdminUsersService },
      ],
    }).compile();

    service = module.get<AdminUserReportsService>(AdminUserReportsService);
  });

  describe('getReports', () => {
    it('rejects non-admins', async () => {
      await expect(
        service.getReports({ id: 'x', role: 'CLIENT' } as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('maps OPEN/UNDER_REVIEW to PENDING for display', async () => {
      mockPrismaService.userReport.findMany.mockResolvedValue([
        { ...report, status: 'OPEN' },
        { ...report, id: 'report-2', status: 'UNDER_REVIEW' },
        { ...report, id: 'report-3', status: 'RESOLVED' },
      ]);

      const result = await service.getReports(admin);

      expect(result.map((r) => r.status)).toEqual(['PENDING', 'PENDING', 'RESOLVED']);
    });
  });

  describe('resolveReport', () => {
    it('throws NotFoundException for a missing report', async () => {
      mockPrismaService.userReport.findUnique.mockResolvedValue(null);
      await expect(
        service.resolveReport('missing', { action: 'DISMISS', resolutionNotes: 'n/a' }, admin)
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when already resolved', async () => {
      mockPrismaService.userReport.findUnique.mockResolvedValue({ ...report, status: 'RESOLVED' });
      await expect(
        service.resolveReport('report-1', { action: 'DISMISS', resolutionNotes: 'n/a' }, admin)
      ).rejects.toThrow(BadRequestException);
    });

    it('WARN notifies the reported user and marks RESOLVED', async () => {
      const result = await service.resolveReport(
        'report-1',
        { action: 'WARN', resolutionNotes: 'Please stop.' },
        admin
      );

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'reported-1', category: 'WARNING' })
      );
      expect(result.status).toBe('RESOLVED');
    });

    it('SUSPEND reuses AdminUsersService.suspendUser', async () => {
      await service.resolveReport(
        'report-1',
        { action: 'SUSPEND', resolutionNotes: 'Repeated harassment.' },
        admin
      );

      expect(mockAdminUsersService.suspendUser).toHaveBeenCalledWith(
        admin,
        'reported-1',
        expect.objectContaining({ durationDays: 30 })
      );
    });

    it('DISMISS marks DISMISSED without suspending or warning', async () => {
      const result = await service.resolveReport(
        'report-1',
        { action: 'DISMISS', resolutionNotes: 'No violation found.' },
        admin
      );

      expect(mockAdminUsersService.suspendUser).not.toHaveBeenCalled();
      expect(result.status).toBe('DISMISSED');
    });

    it('always notifies the original reporter', async () => {
      await service.resolveReport(
        'report-1',
        { action: 'DISMISS', resolutionNotes: 'No violation found.' },
        admin
      );

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'reporter-1' })
      );
    });
  });
});
