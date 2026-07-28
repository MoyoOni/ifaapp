import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// ProBacklog-v1.md structural fix: SacredCalendarEvent was deliberately left
// as a permanent hard-delete (see admin-cultural-content.service.spec.ts's
// own scoping comment) -- but unguarded, RitualParticipation.event and
// EventProductFeature.event are both onDelete:Cascade, so deleting an event
// that had RSVPs or vendor feature requests silently destroyed that history.
// This doesn't add a deletedAt/soft-delete column (still "permanent" as
// decided) -- it reuses the existing isActive field to block the unsafe
// case instead. Separate small spec file, same pattern as
// forum-thread-soft-delete.service.spec.ts, rather than expanding the
// deliberately-narrow OralHistoryEntry-only spec above.
describe('AdminCulturalContentService — deleteSacredEvent cascade guard', () => {
  let service: AdminCulturalContentService;

  const mockPrismaService = {
    sacredCalendarEvent: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ritualParticipation: {
      count: jest.fn(),
    },
    eventProductFeature: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCulturalContentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: { createNotification: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminCulturalContentService>(AdminCulturalContentService);
  });

  describe('deleteSacredEvent', () => {
    it('404s on a missing event', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue(null);

      await expect(service.deleteSacredEvent('missing')).rejects.toThrow(NotFoundException);
    });

    it('hard-deletes an event with no RSVPs and no vendor feature requests', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.ritualParticipation.count.mockResolvedValue(0);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(0);
      mockPrismaService.sacredCalendarEvent.delete.mockResolvedValue({ id: 'event-1' });

      const result = await service.deleteSacredEvent('event-1');

      expect(mockPrismaService.sacredCalendarEvent.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
      expect(mockPrismaService.sacredCalendarEvent.update).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: false });
    });

    it('deactivates instead of deleting when the event has RSVPs', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.ritualParticipation.count.mockResolvedValue(3);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(0);
      mockPrismaService.sacredCalendarEvent.update.mockResolvedValue({ id: 'event-1', isActive: false });

      const result = await service.deleteSacredEvent('event-1');

      expect(mockPrismaService.sacredCalendarEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { isActive: false },
      });
      expect(mockPrismaService.sacredCalendarEvent.delete).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: true });
    });

    it('deactivates instead of deleting when the event has vendor feature requests, even with zero RSVPs', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.ritualParticipation.count.mockResolvedValue(0);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(1);
      mockPrismaService.sacredCalendarEvent.update.mockResolvedValue({ id: 'event-1', isActive: false });

      const result = await service.deleteSacredEvent('event-1');

      expect(mockPrismaService.sacredCalendarEvent.delete).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: true });
    });
  });
});
