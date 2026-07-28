import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    practitionerComplaint: {
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
        ComplaintsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);
  });

  describe('file', () => {
    const dto = {
      practitionerId: 'practitioner-1',
      reason: 'CONTROLLING_BEHAVIOR',
      description: 'This practitioner told me I could not speak to any other Babalawo.',
    };

    it('throws BadRequestException when reporting yourself', async () => {
      await expect(service.file(dto, 'practitioner-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the target is not a practitioner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'practitioner-1', role: 'CLIENT' });
      await expect(service.file(dto, 'client-1')).rejects.toThrow(NotFoundException);
    });

    it('creates a complaint and notifies admins', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'practitioner-1',
        role: 'BABALAWO',
      });
      mockPrismaService.practitionerComplaint.create.mockResolvedValue({ id: 'complaint-1' });
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

      const result = await service.file(dto, 'client-1');

      expect(mockPrismaService.practitionerComplaint.create).toHaveBeenCalledWith({
        data: {
          clientId: 'client-1',
          practitionerId: 'practitioner-1',
          reason: 'CONTROLLING_BEHAVIOR',
          description: dto.description,
          evidence: [],
          flaggedByKeywordRule: false,
          matchedKeywords: [],
        },
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'WARNING' })
      );
      expect(result).toEqual({ id: 'complaint-1' });
    });

    it('COMMUNITY_BACKLOG.md FOR-016: flags the complaint and sends an urgent notification when its description matches an active keyword rule', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'practitioner-1',
        role: 'BABALAWO',
      });
      mockPrismaService.contentFlagRule.findMany.mockResolvedValue([
        { value: 'could not speak to any other' },
      ]);
      mockPrismaService.practitionerComplaint.create.mockResolvedValue({ id: 'complaint-1' });
      mockPrismaService.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

      await service.file(dto, 'client-1');

      expect(mockPrismaService.practitionerComplaint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          flaggedByKeywordRule: true,
          matchedKeywords: ['could not speak to any other'],
        }),
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'URGENT' })
      );
    });

    it('COMMUNITY_BACKLOG.md FOR-016: only evaluates active KEYWORD rules', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'practitioner-1',
        role: 'BABALAWO',
      });
      mockPrismaService.practitionerComplaint.create.mockResolvedValue({ id: 'complaint-1' });

      await service.file(dto, 'client-1');

      expect(mockPrismaService.contentFlagRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: 'KEYWORD', isActive: true } })
      );
    });
  });

  describe('findMine', () => {
    it('returns complaints filed by the client, newest first', async () => {
      mockPrismaService.practitionerComplaint.findMany.mockResolvedValue([{ id: 'complaint-1' }]);
      const result = await service.findMine('client-1');
      expect(mockPrismaService.practitionerComplaint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: 'client-1' }, orderBy: { createdAt: 'desc' } })
      );
      expect(result).toEqual([{ id: 'complaint-1' }]);
    });
  });
});
