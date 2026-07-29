import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from './audit.service';

// COMMUNITY_BACKLOG.md FOR-013 (platform owner decision, July 29, 2026):
// community-proposed rituals. Scoped narrowly to RitualProposal, following
// the same fresh-focused-file precedent as
// admin-cultural-content.service.spec.ts (OralHistoryEntry) and
// admin-cultural-content-delete-guards.service.spec.ts.
describe('AdminCulturalContentService - RitualProposal', () => {
  let service: AdminCulturalContentService;

  const mockPrismaService = {
    ritualProposal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const admin = { id: 'admin-1', role: 'ADMIN' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCulturalContentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuditService, useValue: { logAction: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<AdminCulturalContentService>(AdminCulturalContentService);
  });

  describe('submitRitualProposal', () => {
    it('creates a proposal tied to the submitting user', async () => {
      mockPrismaService.ritualProposal.create.mockResolvedValue({ id: 'proposal-1' });

      await service.submitRitualProposal(
        { title: 'Full Moon Gathering', description: 'A monthly gathering' },
        'user-1'
      );

      expect(mockPrismaService.ritualProposal.create).toHaveBeenCalledWith({
        data: {
          proposedById: 'user-1',
          title: 'Full Moon Gathering',
          description: 'A monthly gathering',
          suggestedDate: undefined,
        },
      });
    });

    it('parses an optional suggestedDate', async () => {
      mockPrismaService.ritualProposal.create.mockResolvedValue({ id: 'proposal-1' });

      await service.submitRitualProposal(
        { title: 'Harvest Rite', description: 'x', suggestedDate: '2026-09-01' },
        'user-1'
      );

      expect(mockPrismaService.ritualProposal.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ suggestedDate: new Date('2026-09-01') }) })
      );
    });
  });

  describe('getRitualProposals', () => {
    it('defaults to PENDING status', async () => {
      mockPrismaService.ritualProposal.findMany.mockResolvedValue([]);
      await service.getRitualProposals();
      expect(mockPrismaService.ritualProposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } })
      );
    });
  });

  describe('reviewRitualProposal', () => {
    it('throws NotFoundException for a missing proposal', async () => {
      mockPrismaService.ritualProposal.findUnique.mockResolvedValue(null);
      await expect(
        service.reviewRitualProposal('missing', 'approve', undefined, admin)
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for an already-reviewed proposal', async () => {
      mockPrismaService.ritualProposal.findUnique.mockResolvedValue({
        id: 'proposal-1',
        status: 'APPROVED',
      });
      await expect(
        service.reviewRitualProposal('proposal-1', 'approve', undefined, admin)
      ).rejects.toThrow(BadRequestException);
    });

    it('approves a pending proposal and notifies the proposer', async () => {
      mockPrismaService.ritualProposal.findUnique.mockResolvedValue({
        id: 'proposal-1',
        status: 'PENDING',
        title: 'Full Moon Gathering',
        proposedById: 'user-1',
      });
      mockPrismaService.ritualProposal.update.mockResolvedValue({ status: 'APPROVED' });

      await service.reviewRitualProposal('proposal-1', 'approve', undefined, admin);

      expect(mockPrismaService.ritualProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-1' },
        data: {
          status: 'APPROVED',
          reviewedBy: 'admin-1',
          reviewedAt: expect.any(Date),
          reviewNote: undefined,
        },
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' })
      );
    });

    it('rejects a pending proposal without throwing', async () => {
      mockPrismaService.ritualProposal.findUnique.mockResolvedValue({
        id: 'proposal-1',
        status: 'PENDING',
        title: 'Full Moon Gathering',
        proposedById: 'user-1',
      });
      mockPrismaService.ritualProposal.update.mockResolvedValue({ status: 'REJECTED' });

      const result = await service.reviewRitualProposal('proposal-1', 'reject', 'not culturally accurate', admin);

      expect(result).toEqual({ status: 'REJECTED' });
      expect(mockPrismaService.ritualProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
      );
    });
  });
});
