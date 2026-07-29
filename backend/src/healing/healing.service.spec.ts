import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HealingService } from './healing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// Zero prior coverage of this service. Written alongside the FOR-018 "elder
// private notes" addition (platform owner decision, July 29, 2026) -- the
// key invariant this suite exists to pin down is that elderPrivateNotes
// never leaks to the reporter/respondent, only to the assigned elder/admin.
describe('HealingService', () => {
  let service: HealingService;
  let prisma: {
    healingCase: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findMany: jest.Mock; findUnique: jest.Mock };
  };
  let notificationService: { createNotification: jest.Mock };

  const baseCase = {
    id: 'case-1',
    reporterId: 'reporter-1',
    respondentId: 'respondent-1',
    category: 'INTERPERSONAL_CONFLICT',
    description: 'a conflict',
    status: 'IN_MEDIATION',
    assignedElderId: 'elder-1',
    assignedAt: new Date(),
    resolutionNotes: null,
    elderPrivateNotes: 'private mediation notes',
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      healingCase: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() },
    };
    notificationService = { createNotification: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealingService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(HealingService);
  });

  describe('findMine', () => {
    it('strips elderPrivateNotes for the reporter/respondent', async () => {
      prisma.healingCase.findMany.mockResolvedValue([baseCase]);
      const result = await service.findMine('reporter-1');
      expect(result[0]).not.toHaveProperty('elderPrivateNotes');
      expect(result[0].resolutionNotes).toBeNull();
    });
  });

  describe('findOne', () => {
    it('strips elderPrivateNotes when the viewer is the reporter', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      const result = await service.findOne('case-1', 'reporter-1', 'CLIENT');
      expect(result).not.toHaveProperty('elderPrivateNotes');
    });

    it('strips elderPrivateNotes when the viewer is the respondent', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      const result = await service.findOne('case-1', 'respondent-1', 'CLIENT');
      expect(result).not.toHaveProperty('elderPrivateNotes');
    });

    it('includes elderPrivateNotes for the assigned elder', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      const result = await service.findOne('case-1', 'elder-1', 'BABALAWO');
      expect(result.elderPrivateNotes).toBe('private mediation notes');
    });

    it('includes elderPrivateNotes for an admin, even if not the assigned elder', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      const result = await service.findOne('case-1', 'admin-1', 'ADMIN');
      expect(result.elderPrivateNotes).toBe('private mediation notes');
    });

    it('rejects a viewer with no relationship to the case', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      await expect(service.findOne('case-1', 'stranger-1', 'CLIENT')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('updateElderNotes', () => {
    it('allows the assigned elder to set notes', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      prisma.healingCase.update.mockResolvedValue({ ...baseCase, elderPrivateNotes: 'updated' });
      const result = await service.updateElderNotes('case-1', 'elder-1', false, {
        elderPrivateNotes: 'updated',
      });
      expect(prisma.healingCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { elderPrivateNotes: 'updated' },
      });
      expect(result.elderPrivateNotes).toBe('updated');
    });

    it('allows an admin to set notes even if not the assigned elder', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      prisma.healingCase.update.mockResolvedValue({ ...baseCase, elderPrivateNotes: 'admin note' });
      await service.updateElderNotes('case-1', 'admin-1', true, { elderPrivateNotes: 'admin note' });
      expect(prisma.healingCase.update).toHaveBeenCalled();
    });

    it('rejects a non-assigned, non-admin elder', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      await expect(
        service.updateElderNotes('case-1', 'other-elder', false, { elderPrivateNotes: 'x' })
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.healingCase.update).not.toHaveBeenCalled();
    });

    it('rejects the reporter trying to set notes', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(baseCase);
      await expect(
        service.updateElderNotes('case-1', 'reporter-1', false, { elderPrivateNotes: 'x' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for a missing case', async () => {
      prisma.healingCase.findUnique.mockResolvedValue(null);
      await expect(
        service.updateElderNotes('missing', 'elder-1', false, { elderPrivateNotes: 'x' })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
