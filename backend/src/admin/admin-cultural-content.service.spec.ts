import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from './audit.service';

// Scoped to the OralHistoryEntry methods touched by ProBacklog-v1.md item #12
// (soft-delete audit) -- not full coverage of this service's other models
// (DailyYorubaWord, SacredCalendarEvent), which were left as intentionally
// permanent per that audit.
describe('AdminCulturalContentService - OralHistoryEntry soft delete', () => {
  let service: AdminCulturalContentService;

  const mockPrismaService = {
    oralHistoryEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

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

  describe('deleteOralHistory', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.oralHistoryEntry.findUnique.mockResolvedValue({ id: 'entry-1' });
      mockPrismaService.oralHistoryEntry.update.mockResolvedValue({ id: 'entry-1' });

      await service.deleteOralHistory('entry-1');

      expect(mockPrismaService.oralHistoryEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('404s on an already-deleted entry instead of re-timestamping it', async () => {
      mockPrismaService.oralHistoryEntry.findUnique.mockResolvedValue(null);

      await expect(service.deleteOralHistory('entry-1')).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.oralHistoryEntry.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });
  });

  describe('read paths filter out soft-deleted entries', () => {
    it('getOralHistories (admin queue)', async () => {
      mockPrismaService.oralHistoryEntry.findMany.mockResolvedValue([]);
      await service.getOralHistories();
      expect(mockPrismaService.oralHistoryEntry.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });

    it('getPublishedOralHistories (public browse)', async () => {
      mockPrismaService.oralHistoryEntry.findMany.mockResolvedValue([]);
      await service.getPublishedOralHistories({});
      expect(mockPrismaService.oralHistoryEntry.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
    });
  });
});
