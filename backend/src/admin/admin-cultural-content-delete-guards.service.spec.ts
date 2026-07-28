import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// ProBacklog-v1.md structural fix: two cascade-loss guards in this service's
// other delete methods (SacredCalendarEvent was deliberately left as a
// permanent hard-delete -- see admin-cultural-content.service.spec.ts's own
// scoping comment -- and DailyYorubaWord similarly had none). Both had real
// onDelete:Cascade dependents with no guard: RitualParticipation.event /
// EventProductFeature.event for events, UserWordHistory.word for words.
// Separate small spec file, same pattern as
// forum-thread-soft-delete.service.spec.ts, rather than expanding the
// deliberately-narrow OralHistoryEntry-only spec above.
describe('AdminCulturalContentService — cascade-loss delete guards', () => {
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
    dailyYorubaWord: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    userWordHistory: {
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

  describe('deleteDailyWord', () => {
    it('404s on a missing word', async () => {
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue(null);

      await expect(service.deleteDailyWord('missing')).rejects.toThrow(NotFoundException);
    });

    it('deletes a word nobody has viewed yet', async () => {
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue({ id: 'word-1' });
      mockPrismaService.userWordHistory.count.mockResolvedValue(0);
      mockPrismaService.dailyYorubaWord.delete.mockResolvedValue({ id: 'word-1' });

      await service.deleteDailyWord('word-1');

      expect(mockPrismaService.dailyYorubaWord.delete).toHaveBeenCalledWith({ where: { id: 'word-1' } });
    });

    it('rejects deleting a word that has view history, instead of cascading it away from user history lists', async () => {
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue({ id: 'word-1' });
      mockPrismaService.userWordHistory.count.mockResolvedValue(12);

      await expect(service.deleteDailyWord('word-1')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.dailyYorubaWord.delete).not.toHaveBeenCalled();
    });
  });
});
