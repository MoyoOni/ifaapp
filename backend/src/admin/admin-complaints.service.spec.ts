import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminComplaintsService } from './admin-complaints.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AdminUsersService } from './admin-users.service';
import { DisputesService } from '../disputes/disputes.service';
import { UsersService } from '../users/users.service';

describe('AdminComplaintsService', () => {
  let service: AdminComplaintsService;

  const mockPrismaService = {
    practitionerComplaint: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminUsersService = {
    suspendUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockDisputesService = {
    createFromComplaint: jest.fn().mockResolvedValue({ id: 'dispute-1' }),
  };

  const mockUsersService = {
    recomputeTrustScore: jest.fn().mockResolvedValue(0),
  };

  const admin = { id: 'admin-1', role: 'ADMIN' } as any;
  const complaint = {
    id: 'complaint-1',
    clientId: 'client-1',
    practitionerId: 'practitioner-1',
    reason: 'CONTROLLING_BEHAVIOR',
    description: 'Told me I could never see another practitioner.',
    status: 'OPEN',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.practitionerComplaint.findUnique.mockResolvedValue(complaint);
    mockPrismaService.practitionerComplaint.update.mockImplementation(({ data }: any) => ({
      ...complaint,
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminComplaintsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AdminUsersService, useValue: mockAdminUsersService },
        { provide: DisputesService, useValue: mockDisputesService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AdminComplaintsService>(AdminComplaintsService);
  });

  describe('getComplaints', () => {
    it('throws ForbiddenException for non-admins', async () => {
      await expect(service.getComplaints({ id: 'x', role: 'CLIENT' } as any)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('COMMUNITY_BACKLOG.md FOR-016: orders keyword-flagged complaints before unflagged ones', async () => {
      mockPrismaService.practitionerComplaint.findMany.mockResolvedValue([]);

      await service.getComplaints(admin);

      expect(mockPrismaService.practitionerComplaint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ flaggedByKeywordRule: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });
  });

  describe('resolveComplaint', () => {
    it('throws NotFoundException when the complaint does not exist', async () => {
      mockPrismaService.practitionerComplaint.findUnique.mockResolvedValue(null);
      await expect(
        service.resolveComplaint(
          'missing',
          { action: 'WARN', resolutionNotes: 'n', clientNotification: 'c' } as any,
          admin
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when already resolved', async () => {
      mockPrismaService.practitionerComplaint.findUnique.mockResolvedValue({
        ...complaint,
        status: 'RESOLVED',
      });
      await expect(
        service.resolveComplaint(
          'complaint-1',
          { action: 'WARN', resolutionNotes: 'n', clientNotification: 'c' } as any,
          admin
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('DISMISS sets status to DISMISSED, takes no account action, and does not recompute trust score', async () => {
      const result = await service.resolveComplaint(
        'complaint-1',
        {
          action: 'DISMISS',
          resolutionNotes: 'No wrongdoing found',
          clientNotification: 'We reviewed and found no issue.',
        } as any,
        admin
      );
      expect(result.status).toBe('DISMISSED');
      expect(mockAdminUsersService.suspendUser).not.toHaveBeenCalled();
      expect(mockDisputesService.createFromComplaint).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockUsersService.recomputeTrustScore).not.toHaveBeenCalled();
    });

    it('a RESOLVED outcome recomputes the practitioner trust score immediately', async () => {
      await service.resolveComplaint(
        'complaint-1',
        { action: 'WARN', resolutionNotes: 'n', clientNotification: 'c' } as any,
        admin
      );
      expect(mockUsersService.recomputeTrustScore).toHaveBeenCalledWith('practitioner-1');
    });

    it('WARN resolves and notifies the practitioner', async () => {
      const result = await service.resolveComplaint(
        'complaint-1',
        {
          action: 'WARN',
          resolutionNotes: 'Please respect client boundaries',
          clientNotification: 'We warned them.',
        } as any,
        admin
      );
      expect(result.status).toBe('RESOLVED');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'practitioner-1' })
      );
    });

    it('SUSPEND_BOOKINGS reuses the existing suspension mechanism', async () => {
      await service.resolveComplaint(
        'complaint-1',
        {
          action: 'SUSPEND_BOOKINGS',
          resolutionNotes: 'Upheld',
          clientNotification: 'Suspended.',
        } as any,
        admin
      );
      expect(mockAdminUsersService.suspendUser).toHaveBeenCalledWith(
        admin,
        'practitioner-1',
        expect.objectContaining({ durationDays: 30 })
      );
    });

    it('REVOKE_VERIFICATION unverifies the practitioner', async () => {
      await service.resolveComplaint(
        'complaint-1',
        {
          action: 'REVOKE_VERIFICATION',
          resolutionNotes: 'Serious violation',
          clientNotification: 'Revoked.',
        } as any,
        admin
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'practitioner-1' },
        data: { verified: false },
      });
    });

    it('ESCALATE creates a spiritual-misconduct Dispute routed to the same complainant/respondent', async () => {
      await service.resolveComplaint(
        'complaint-1',
        {
          action: 'ESCALATE',
          resolutionNotes: 'Needs Advisory Board review',
          clientNotification: 'Escalated.',
        } as any,
        admin
      );
      expect(mockDisputesService.createFromComplaint).toHaveBeenCalledWith(
        'client-1',
        'practitioner-1',
        expect.any(String),
        complaint.description
      );
    });

    it('always notifies the complainant, finally using clientNotification', async () => {
      await service.resolveComplaint(
        'complaint-1',
        {
          action: 'WARN',
          resolutionNotes: 'n',
          clientNotification: 'Thanks for letting us know.',
        } as any,
        admin
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
          message: expect.stringContaining('Thanks for letting us know.'),
        })
      );
    });
  });
});
