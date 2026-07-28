import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminContentService } from './admin-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

// P0-03: deleteQuizQuestion() had no existence guard at all and never
// logged its deletions anywhere queryable before this fix.
describe('AdminContentService', () => {
  let service: AdminContentService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', verified: true } as any;

  const mockPrismaService = {
    culturalQuizQuestion: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminContentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminContentService>(AdminContentService);
  });

  describe('deleteQuizQuestion', () => {
    it('404s on a missing question instead of calling prisma.delete blind', async () => {
      mockPrismaService.culturalQuizQuestion.findUnique.mockResolvedValue(null);

      await expect(service.deleteQuizQuestion('missing', mockAdmin)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.culturalQuizQuestion.delete).not.toHaveBeenCalled();
    });

    it('deletes the question and logs it to AuditLog with a snapshot', async () => {
      const question = { id: 'q-1', questionText: 'What is Àṣẹ?' };
      mockPrismaService.culturalQuizQuestion.findUnique.mockResolvedValue(question);
      mockPrismaService.culturalQuizQuestion.delete.mockResolvedValue(question);

      const result = await service.deleteQuizQuestion('q-1', mockAdmin);

      expect(mockPrismaService.culturalQuizQuestion.delete).toHaveBeenCalledWith({ where: { id: 'q-1' } });
      expect(result).toEqual({ success: true });
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'CulturalQuizQuestion',
          entityId: 'q-1',
          payload: { snapshot: question },
        })
      );
    });
  });
});
