import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnnouncementSeverity, AnnouncementTarget } from './dto/create-announcement.dto';

describe('AdminAnnouncementsService', () => {
  let service: AdminAnnouncementsService;
  let prisma: PrismaService;

  const mockAdminUser = {
    id: 'admin-1',
    sub: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    verified: true,
  };

  const mockClientUser = {
    id: 'client-1',
    sub: 'client-1',
    email: 'client@example.com',
    role: 'CLIENT',
    verified: true,
  };

  const baseRow = {
    id: 'ann-1',
    title: 'Scheduled maintenance',
    content: 'The site will be down Saturday 2-4am',
    type: AnnouncementSeverity.INFO,
    target: AnnouncementTarget.ALL,
    targetIds: [] as string[],
    status: 'ACTIVE',
    scheduledAt: null as Date | null,
    expiresAt: null as Date | null,
    createdAt: new Date('2026-07-01T00:00:00Z'),
  };

  const mockPrismaService = {
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnnouncementsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminAnnouncementsService>(AdminAnnouncementsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws ForbiddenException for non-admin users', async () => {
      await expect(
        service.create(
          { title: 'x', message: 'y', type: AnnouncementSeverity.INFO },
          mockClientUser
        )
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.announcement.create).not.toHaveBeenCalled();
    });

    it('creates an ACTIVE announcement with no scheduledAt', async () => {
      mockPrismaService.announcement.create.mockResolvedValue(baseRow);

      const result = await service.create(
        { title: baseRow.title, message: baseRow.content, type: AnnouncementSeverity.INFO },
        mockAdminUser
      );

      expect(mockPrismaService.announcement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: baseRow.title,
          content: baseRow.content,
          status: 'ACTIVE',
          target: AnnouncementTarget.ALL,
          createdBy: mockAdminUser.id,
        }),
      });
      expect(result.message).toBe(baseRow.content);
      expect(result.isActive).toBe(true);
    });

    it('creates a SCHEDULED announcement when scheduledAt is in the future', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      mockPrismaService.announcement.create.mockResolvedValue({
        ...baseRow,
        status: 'SCHEDULED',
        scheduledAt: new Date(future),
      });

      await service.create(
        { title: 'x', message: 'y', type: AnnouncementSeverity.INFO, scheduledAt: future },
        mockAdminUser
      );

      expect(mockPrismaService.announcement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'SCHEDULED' }),
      });
    });
  });

  describe('findAllForAdmin', () => {
    it('throws ForbiddenException for non-admin users', async () => {
      await expect(service.findAllForAdmin(mockClientUser)).rejects.toThrow(ForbiddenException);
    });

    it('returns all announcements mapped to the view shape', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([baseRow]);

      const result = await service.findAllForAdmin(mockAdminUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'ann-1', message: baseRow.content, isActive: true });
    });
  });

  describe('findActiveForUser', () => {
    it('includes an ALL-targeted announcement for any role', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([baseRow]);

      const result = await service.findActiveForUser(mockClientUser);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('excludes a SPECIFIC-targeted announcement not addressed to this user', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([
        { ...baseRow, target: AnnouncementTarget.SPECIFIC, targetIds: ['someone-else'] },
      ]);

      const result = await service.findActiveForUser(mockClientUser);

      expect(result).toHaveLength(0);
    });

    it('includes a SPECIFIC-targeted announcement addressed to this user', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([
        { ...baseRow, target: AnnouncementTarget.SPECIFIC, targetIds: [mockClientUser.id] },
      ]);

      const result = await service.findActiveForUser(mockClientUser);

      expect(result).toHaveLength(1);
    });

    it('only checks subscription status when a DEVOTED-targeted announcement is a candidate', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([
        { ...baseRow, target: AnnouncementTarget.DEVOTED },
      ]);
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED' });

      const result = await service.findActiveForUser(mockClientUser);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockClientUser.id },
        select: { subscriptionStatus: true },
      });
      expect(result).toHaveLength(1);
    });

    it('excludes a DEVOTED-targeted announcement when the user is not devoted', async () => {
      mockPrismaService.announcement.findMany.mockResolvedValue([
        { ...baseRow, target: AnnouncementTarget.DEVOTED },
      ]);
      mockPrismaService.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });

      const result = await service.findActiveForUser(mockClientUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('deactivate', () => {
    it('throws ForbiddenException for non-admin users', async () => {
      await expect(service.deactivate('ann-1', mockClientUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the announcement does not exist', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('missing', mockAdminUser)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.announcement.update).not.toHaveBeenCalled();
    });

    it('sets status to EXPIRED and expiresAt to now', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(baseRow);
      mockPrismaService.announcement.update.mockResolvedValue({
        ...baseRow,
        status: 'EXPIRED',
        expiresAt: new Date(),
      });

      const result = await service.deactivate('ann-1', mockAdminUser);

      expect(mockPrismaService.announcement.update).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        data: { status: 'EXPIRED', expiresAt: expect.any(Date) },
      });
      expect(result.isActive).toBe(false);
    });
  });
});
