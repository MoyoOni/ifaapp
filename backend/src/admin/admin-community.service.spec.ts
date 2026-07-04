import { Test, TestingModule } from '@nestjs/testing';
import { AdminCommunityService } from './admin-community.service';
import { PrismaService } from '../prisma/prisma.service';
import { CirclesService } from '../circles/circles.service';

// P2-04: moved from admin.service.spec.ts along with the moderateCircle
// (P0-03 soft delete) logic itself, when AdminService was split.

describe('AdminCommunityService', () => {
  let service: AdminCommunityService;
  let prisma: PrismaService;

  const mockAdminUser = {
    id: 'admin-1',
    sub: 'admin-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    verified: true,
  };

  const mockNonAdminUser = {
    id: 'user-1',
    sub: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
    verified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCommunityService,
        {
          provide: CirclesService,
          useValue: { createFromSuggestion: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            reportedContent: { findMany: jest.fn() },
            advisoryBoardVote: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            circleSuggestion: { findMany: jest.fn() },
            circle: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            event: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AdminCommunityService>(AdminCommunityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('moderateCircle (P0-03 soft delete)', () => {
    const mockCircle = { id: 'circle-1', status: 'ACTIVE', active: true };

    it('soft-deletes the circle on DELETE instead of removing the row', async () => {
      (prisma.circle.findUnique as jest.Mock).mockResolvedValue(mockCircle);
      const updateSpy = prisma.circle.update as jest.Mock;
      updateSpy.mockResolvedValue({ ...mockCircle, status: 'DELETED', active: false });

      const result = await service.moderateCircle('circle-1', 'DELETE', mockAdminUser as any);

      expect(result.status).toBe('DELETED');
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'circle-1' },
          data: { status: 'DELETED', active: false },
        }),
      );
      expect(prisma.circle.delete).not.toHaveBeenCalled();
    });

    it('rejects moderation from a non-admin', async () => {
      await expect(
        service.moderateCircle('circle-1', 'DELETE', mockNonAdminUser as any),
      ).rejects.toThrow('Only admins can moderate circles');
      expect(prisma.circle.update).not.toHaveBeenCalled();
    });

    it('still supports ARCHIVE and ACTIVATE via the same status map', async () => {
      (prisma.circle.findUnique as jest.Mock).mockResolvedValue(mockCircle);
      const updateSpy = prisma.circle.update as jest.Mock;
      updateSpy.mockResolvedValue({ ...mockCircle, status: 'ARCHIVED', active: false });

      await service.moderateCircle('circle-1', 'ARCHIVE', mockAdminUser as any);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ARCHIVED', active: false } }),
      );
    });
  });
});
