import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TechHelpService } from './tech-help.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// COMMUNITY_BACKLOG.md FOR-009 (platform owner decision, July 29, 2026):
// low-friction tech-help board for elders. Zero prior coverage (new module).
describe('TechHelpService', () => {
  let service: TechHelpService;

  const mockPrismaService = {
    techHelpRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechHelpService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<TechHelpService>(TechHelpService);
  });

  describe('ask', () => {
    it('rejects a non-BABALAWO role', async () => {
      await expect(service.ask({ question: 'How do I upload a photo?' }, 'user-1', 'CLIENT')).rejects.toThrow(
        ForbiddenException
      );
      expect(mockPrismaService.techHelpRequest.create).not.toHaveBeenCalled();
    });

    it('rejects an ADMIN too -- this board is specifically for elders', async () => {
      await expect(service.ask({ question: 'x' }, 'admin-1', 'ADMIN')).rejects.toThrow(ForbiddenException);
    });

    it('creates a request for a BABALAWO', async () => {
      mockPrismaService.techHelpRequest.create.mockResolvedValue({ id: 'req-1' });
      await service.ask({ question: 'How do I upload a photo?' }, 'elder-1', 'BABALAWO');
      expect(mockPrismaService.techHelpRequest.create).toHaveBeenCalledWith({
        data: { requesterId: 'elder-1', question: 'How do I upload a photo?' },
      });
    });
  });

  describe('findOpen', () => {
    it('filters to OPEN status', async () => {
      mockPrismaService.techHelpRequest.findMany.mockResolvedValue([]);
      await service.findOpen();
      expect(mockPrismaService.techHelpRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'OPEN' } })
      );
    });
  });

  describe('answer', () => {
    it('throws NotFoundException for a missing request', async () => {
      mockPrismaService.techHelpRequest.findUnique.mockResolvedValue(null);
      await expect(service.answer('missing', { answer: 'x' }, 'helper-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws BadRequestException if already answered', async () => {
      mockPrismaService.techHelpRequest.findUnique.mockResolvedValue({ id: 'req-1', status: 'ANSWERED' });
      await expect(service.answer('req-1', { answer: 'x' }, 'helper-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('answers an open request and notifies the requester', async () => {
      mockPrismaService.techHelpRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'OPEN',
        requesterId: 'elder-1',
      });
      mockPrismaService.techHelpRequest.update.mockResolvedValue({ status: 'ANSWERED' });

      await service.answer('req-1', { answer: 'Tap the camera icon' }, 'helper-1');

      expect(mockPrismaService.techHelpRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          status: 'ANSWERED',
          answer: 'Tap the camera icon',
          answeredById: 'helper-1',
          answeredAt: expect.any(Date),
        },
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'elder-1' })
      );
    });

    it('allows any authenticated user (not just admins) to answer', async () => {
      mockPrismaService.techHelpRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'OPEN',
        requesterId: 'elder-1',
      });
      mockPrismaService.techHelpRequest.update.mockResolvedValue({ status: 'ANSWERED' });

      await expect(service.answer('req-1', { answer: 'x' }, 'random-client-1')).resolves.toBeDefined();
    });
  });
});
