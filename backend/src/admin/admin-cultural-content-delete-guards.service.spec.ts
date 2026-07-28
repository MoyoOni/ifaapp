import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCulturalContentService } from './admin-cultural-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from './audit.service';

// ProBacklog-v1.md structural fix: two cascade-loss guards in this service's
// other delete methods (SacredCalendarEvent was deliberately left as a
// permanent hard-delete -- see admin-cultural-content.service.spec.ts's own
// scoping comment -- and DailyYorubaWord similarly had none). Both had real
// onDelete:Cascade dependents with no guard: RitualParticipation.event /
// EventProductFeature.event for events, UserWordHistory.word for words.
// Both now also log to the real AuditLog table (P0-03). Separate small spec
// file, same pattern as forum-thread-soft-delete.service.spec.ts, rather
// than expanding the deliberately-narrow OralHistoryEntry-only spec above.
describe('AdminCulturalContentService — cascade-loss delete guards', () => {
  let service: AdminCulturalContentService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', verified: true } as any;

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

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCulturalContentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: { createNotification: jest.fn() } },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminCulturalContentService>(AdminCulturalContentService);
  });

  describe('deleteSacredEvent', () => {
    it('404s on a missing event', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue(null);

      await expect(service.deleteSacredEvent('missing', mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('hard-deletes an event with no RSVPs and no vendor feature requests, and logs the deletion', async () => {
      const event = { id: 'event-1', title: 'Full Moon Rite' };
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue(event);
      mockPrismaService.ritualParticipation.count.mockResolvedValue(0);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(0);
      mockPrismaService.sacredCalendarEvent.delete.mockResolvedValue(event);

      const result = await service.deleteSacredEvent('event-1', mockAdmin);

      expect(mockPrismaService.sacredCalendarEvent.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
      expect(mockPrismaService.sacredCalendarEvent.update).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: false });
      // P0-03: real queryable audit trail for hard deletes.
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'SacredCalendarEvent',
          entityId: 'event-1',
          payload: { snapshot: event },
        })
      );
    });

    it('deactivates instead of deleting when the event has RSVPs, and does not log a DELETE audit entry', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.ritualParticipation.count.mockResolvedValue(3);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(0);
      mockPrismaService.sacredCalendarEvent.update.mockResolvedValue({ id: 'event-1', isActive: false });

      const result = await service.deleteSacredEvent('event-1', mockAdmin);

      expect(mockPrismaService.sacredCalendarEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { isActive: false },
      });
      expect(mockPrismaService.sacredCalendarEvent.delete).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: true });
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('deactivates instead of deleting when the event has vendor feature requests, even with zero RSVPs', async () => {
      mockPrismaService.sacredCalendarEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.ritualParticipation.count.mockResolvedValue(0);
      mockPrismaService.eventProductFeature.count.mockResolvedValue(1);
      mockPrismaService.sacredCalendarEvent.update.mockResolvedValue({ id: 'event-1', isActive: false });

      const result = await service.deleteSacredEvent('event-1', mockAdmin);

      expect(mockPrismaService.sacredCalendarEvent.delete).not.toHaveBeenCalled();
      expect(result).toMatchObject({ deactivated: true });
    });
  });

  describe('deleteDailyWord', () => {
    it('404s on a missing word', async () => {
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue(null);

      await expect(service.deleteDailyWord('missing', mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('deletes a word nobody has viewed yet, and logs the deletion', async () => {
      const word = { id: 'word-1', word: 'Àṣẹ' };
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue(word);
      mockPrismaService.userWordHistory.count.mockResolvedValue(0);
      mockPrismaService.dailyYorubaWord.delete.mockResolvedValue(word);

      await service.deleteDailyWord('word-1', mockAdmin);

      expect(mockPrismaService.dailyYorubaWord.delete).toHaveBeenCalledWith({ where: { id: 'word-1' } });
      // P0-03: real queryable audit trail for hard deletes.
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'DailyYorubaWord',
          entityId: 'word-1',
          payload: { snapshot: word },
        })
      );
    });

    it('rejects deleting a word that has view history, instead of cascading it away from user history lists', async () => {
      mockPrismaService.dailyYorubaWord.findUnique.mockResolvedValue({ id: 'word-1' });
      mockPrismaService.userWordHistory.count.mockResolvedValue(12);

      await expect(service.deleteDailyWord('word-1', mockAdmin)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.dailyYorubaWord.delete).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });
  });
});
